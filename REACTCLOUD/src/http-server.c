/*
 * Minimal HTTP wrapper for REACT/chemdb.
 *
 * Supported endpoints:
 *   GET  /               - API summary
 *   GET  /health         - Health check
 *   POST /api/run        - Execute chemdb with JSON body: {"args":["--help"]}
 *   POST /api/run-input  - Execute runchem.sh with an input template
 */

#include <arpa/inet.h>
#include <ctype.h>
#include <errno.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#define DEFAULT_PORT 8080
#define MAX_ARGS 32
#define MAX_REPLACEMENTS 64
#define MAX_REQUEST_SIZE (1024 * 1024)
#define READ_CHUNK 4096
#define MAX_PATH_LENGTH 1024

typedef struct Replacement {
    char *key;
    char *value;
} Replacement;

static volatile sig_atomic_t keep_running = 1;

static const char *reactroot_env(void)
{
    const char *reactroot = getenv("REACTROOT");
    return (reactroot == NULL || *reactroot == '\0') ? "/opt/react" : reactroot;
}

static void handle_signal(int signum)
{
    (void) signum;
    keep_running = 0;
}

static const char *status_text(int status)
{
    switch (status) {
    case 200:
        return "OK";
    case 400:
        return "Bad Request";
    case 401:
        return "Unauthorized";
    case 404:
        return "Not Found";
    case 405:
        return "Method Not Allowed";
    case 500:
        return "Internal Server Error";
    default:
        return "OK";
    }
}

static int send_all(int fd, const char *buffer, size_t length)
{
    size_t written = 0;

    while (written < length) {
        ssize_t current = write(fd, buffer + written, length - written);
        if (current < 0) {
            if (errno == EINTR) {
                continue;
            }
            return -1;
        }
        written += (size_t) current;
    }

    return 0;
}

static int send_response(int fd, int status, const char *content_type, const char *body)
{
    char header[512];
    size_t body_length = strlen(body);
    int header_length;

    header_length = snprintf(
        header,
        sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization, X-Goog-Authenticated-User-Email\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Connection: close\r\n"
        "\r\n",
        status,
        status_text(status),
        content_type,
        body_length);

    if (header_length < 0 || (size_t) header_length >= sizeof(header)) {
        return -1;
    }

    if (send_all(fd, header, (size_t) header_length) != 0) {
        return -1;
    }

    return send_all(fd, body, body_length);
}

static char *json_escape(const char *input)
{
    size_t length = 0;
    size_t i;
    char *output;
    char *cursor;

    for (i = 0; input[i] != '\0'; ++i) {
        switch (input[i]) {
        case '\\':
        case '"':
            length += 2;
            break;
        case '\n':
        case '\r':
        case '\t':
            length += 2;
            break;
        default:
            if ((unsigned char) input[i] < 0x20) {
                length += 6;
            } else {
                length += 1;
            }
            break;
        }
    }

    output = (char *) malloc(length + 1);
    if (output == NULL) {
        return NULL;
    }

    cursor = output;
    for (i = 0; input[i] != '\0'; ++i) {
        switch (input[i]) {
        case '\\':
            *cursor++ = '\\';
            *cursor++ = '\\';
            break;
        case '"':
            *cursor++ = '\\';
            *cursor++ = '"';
            break;
        case '\n':
            *cursor++ = '\\';
            *cursor++ = 'n';
            break;
        case '\r':
            *cursor++ = '\\';
            *cursor++ = 'r';
            break;
        case '\t':
            *cursor++ = '\\';
            *cursor++ = 't';
            break;
        default:
            if ((unsigned char) input[i] < 0x20) {
                cursor += sprintf(cursor, "\\u%04x", (unsigned char) input[i]);
            } else {
                *cursor++ = input[i];
            }
            break;
        }
    }

    *cursor = '\0';
    return output;
}

static char *build_json_message(const char *template_text, ...)
{
    va_list arguments;
    va_list arguments_copy;
    int length;
    char *message;

    va_start(arguments, template_text);
    va_copy(arguments_copy, arguments);
    length = vsnprintf(NULL, 0, template_text, arguments_copy);
    va_end(arguments_copy);

    if (length < 0) {
        va_end(arguments);
        return NULL;
    }

    message = (char *) malloc((size_t) length + 1);
    if (message == NULL) {
        va_end(arguments);
        return NULL;
    }

    vsnprintf(message, (size_t) length + 1, template_text, arguments);
    va_end(arguments);
    return message;
}

static int find_header_end(const char *buffer, size_t length, size_t *header_end)
{
    size_t i;

    if (length < 4) {
        return 0;
    }

    for (i = 0; i + 3 < length; ++i) {
        if (buffer[i] == '\r' && buffer[i + 1] == '\n' &&
            buffer[i + 2] == '\r' && buffer[i + 3] == '\n') {
            *header_end = i + 4;
            return 1;
        }
    }

    return 0;
}

static char *find_header_value(char *headers, const char *name)
{
    size_t name_length = strlen(name);
    char *line = headers;

    while (line != NULL && *line != '\0') {
        char *next = strstr(line, "\r\n");
        if (next != NULL) {
            *next = '\0';
        }

        if (strncasecmp(line, name, name_length) == 0 && line[name_length] == ':') {
            char *value = line + name_length + 1;
            while (*value != '\0' && isspace((unsigned char) *value)) {
                ++value;
            }
            if (next != NULL) {
                *next = '\r';
            }
            return value;
        }

        if (next == NULL) {
            break;
        }

        *next = '\r';
        line = next + 2;
    }

    return NULL;
}

static int read_request(int fd, char **request, size_t *request_length, size_t *header_end)
{
    char *buffer = NULL;
    size_t capacity = 0;
    size_t total = 0;
    size_t end = 0;
    size_t expected_length = 0;
    int have_headers = 0;

    while (total < MAX_REQUEST_SIZE) {
        ssize_t current;

        if (capacity - total < READ_CHUNK) {
            size_t next_capacity = capacity == 0 ? READ_CHUNK * 2 : capacity * 2;
            char *next_buffer = (char *) realloc(buffer, next_capacity);
            if (next_buffer == NULL) {
                free(buffer);
                return -1;
            }
            buffer = next_buffer;
            capacity = next_capacity;
        }

        current = read(fd, buffer + total, capacity - total);
        if (current < 0) {
            if (errno == EINTR) {
                continue;
            }
            free(buffer);
            return -1;
        }
        if (current == 0) {
            break;
        }

        total += (size_t) current;

        if (!have_headers && find_header_end(buffer, total, &end)) {
            char saved;
            char *headers;
            char *value;

            have_headers = 1;
            headers = buffer;
            saved = headers[end - 2];
            headers[end - 2] = '\0';
            value = find_header_value(headers, "Content-Length");
            if (value != NULL) {
                expected_length = end + (size_t) strtoul(value, NULL, 10);
            } else {
                expected_length = end;
            }
            headers[end - 2] = saved;
        }

        if (have_headers && total >= expected_length) {
            break;
        }
    }

    if (!have_headers) {
        free(buffer);
        return -1;
    }

    if (total == capacity) {
        char *next_buffer = (char *) realloc(buffer, capacity + 1);
        if (next_buffer == NULL) {
            free(buffer);
            return -1;
        }
        buffer = next_buffer;
    }

    buffer[total] = '\0';
    *request = buffer;
    *request_length = total;
    *header_end = end;
    return 0;
}

static void skip_whitespace(const char **cursor)
{
    while (**cursor != '\0' && isspace((unsigned char) **cursor)) {
        ++(*cursor);
    }
}

static char *parse_json_string(const char **cursor)
{
    const char *input = *cursor;
    size_t capacity = 64;
    size_t length = 0;
    char *output;

    if (*input != '"') {
        return NULL;
    }
    ++input;

    output = (char *) malloc(capacity);
    if (output == NULL) {
        return NULL;
    }

    while (*input != '\0' && *input != '"') {
        char value;

        if (length + 2 > capacity) {
            char *next_output;
            capacity *= 2;
            next_output = (char *) realloc(output, capacity);
            if (next_output == NULL) {
                free(output);
                return NULL;
            }
            output = next_output;
        }

        if (*input == '\\') {
            ++input;
            switch (*input) {
            case '"':
            case '\\':
            case '/':
                value = *input;
                break;
            case 'b':
                value = '\b';
                break;
            case 'f':
                value = '\f';
                break;
            case 'n':
                value = '\n';
                break;
            case 'r':
                value = '\r';
                break;
            case 't':
                value = '\t';
                break;
            default:
                free(output);
                return NULL;
            }
        } else {
            value = *input;
        }

        output[length++] = value;
        ++input;
    }

    if (*input != '"') {
        free(output);
        return NULL;
    }

    output[length] = '\0';
    *cursor = input + 1;
    return output;
}

static int parse_args_array(const char *body, char **args, int *arg_count)
{
    const char *args_key = strstr(body, "\"args\"");
    const char *cursor;
    int count = 0;

    if (args_key == NULL) {
        return -1;
    }

    cursor = strchr(args_key, ':');
    if (cursor == NULL) {
        return -1;
    }
    ++cursor;
    skip_whitespace(&cursor);

    if (*cursor != '[') {
        return -1;
    }
    ++cursor;

    for (;;) {
        skip_whitespace(&cursor);

        if (*cursor == ']') {
            ++cursor;
            break;
        }

        if (count >= MAX_ARGS) {
            return -1;
        }

        args[count] = parse_json_string(&cursor);
        if (args[count] == NULL) {
            return -1;
        }
        ++count;

        skip_whitespace(&cursor);
        if (*cursor == ',') {
            ++cursor;
            continue;
        }
        if (*cursor == ']') {
            ++cursor;
            break;
        }
        return -1;
    }

    *arg_count = count;
    return count > 0 ? 0 : -1;
}

static int parse_json_field_string(const char *body, const char *field_name, char **value)
{
    char pattern[128];
    const char *field;
    const char *cursor;

    if (snprintf(pattern, sizeof(pattern), "\"%s\"", field_name) >= (int) sizeof(pattern)) {
        return -1;
    }

    field = strstr(body, pattern);
    if (field == NULL) {
        return 1;
    }

    cursor = strchr(field, ':');
    if (cursor == NULL) {
        return -1;
    }
    ++cursor;
    skip_whitespace(&cursor);

    *value = parse_json_string(&cursor);
    return (*value == NULL) ? -1 : 0;
}

static int parse_replacements_object(const char *body, Replacement *replacements, int *count)
{
    const char *field = strstr(body, "\"replacements\"");
    const char *cursor;
    int used = 0;

    if (field == NULL) {
        *count = 0;
        return 0;
    }

    cursor = strchr(field, ':');
    if (cursor == NULL) {
        return -1;
    }
    ++cursor;
    skip_whitespace(&cursor);

    if (*cursor != '{') {
        return -1;
    }
    ++cursor;

    for (;;) {
        char *key;
        char *value;

        skip_whitespace(&cursor);
        if (*cursor == '}') {
            ++cursor;
            break;
        }

        if (used >= MAX_REPLACEMENTS) {
            return -1;
        }

        key = parse_json_string(&cursor);
        if (key == NULL) {
            return -1;
        }

        skip_whitespace(&cursor);
        if (*cursor != ':') {
            free(key);
            return -1;
        }
        ++cursor;
        skip_whitespace(&cursor);

        value = parse_json_string(&cursor);
        if (value == NULL) {
            free(key);
            return -1;
        }

        replacements[used].key = key;
        replacements[used].value = value;
        ++used;

        skip_whitespace(&cursor);
        if (*cursor == ',') {
            ++cursor;
            continue;
        }
        if (*cursor == '}') {
            ++cursor;
            break;
        }
        return -1;
    }

    *count = used;
    return 0;
}

static void free_replacements(Replacement *replacements, int count)
{
    int i;
    for (i = 0; i < count; ++i) {
        free(replacements[i].key);
        free(replacements[i].value);
    }
}

static void free_args(char **args, int arg_count)
{
    int i;
    for (i = 0; i < arg_count; ++i) {
        free(args[i]);
    }
}

static int read_text_file(const char *path, char **content)
{
    FILE *file = fopen(path, "rb");
    long size;
    char *buffer;

    if (file == NULL) {
        return -1;
    }

    if (fseek(file, 0, SEEK_END) != 0) {
        fclose(file);
        return -1;
    }
    size = ftell(file);
    if (size < 0) {
        fclose(file);
        return -1;
    }
    if (fseek(file, 0, SEEK_SET) != 0) {
        fclose(file);
        return -1;
    }

    buffer = (char *) malloc((size_t) size + 1);
    if (buffer == NULL) {
        fclose(file);
        return -1;
    }

    if (size > 0 && fread(buffer, 1, (size_t) size, file) != (size_t) size) {
        free(buffer);
        fclose(file);
        return -1;
    }

    buffer[size] = '\0';
    fclose(file);
    *content = buffer;
    return 0;
}

static int write_text_file(const char *path, const char *content)
{
    FILE *file = fopen(path, "wb");
    size_t len = strlen(content);

    if (file == NULL) {
        return -1;
    }

    if (len > 0 && fwrite(content, 1, len, file) != len) {
        fclose(file);
        return -1;
    }

    fclose(file);
    return 0;
}

static int ensure_directory_exists(const char *path)
{
    struct stat st;
    if (stat(path, &st) == 0) {
        return S_ISDIR(st.st_mode) ? 0 : -1;
    }
    if (mkdir(path, 0755) != 0 && errno != EEXIST) {
        return -1;
    }
    return 0;
}

static int is_safe_input_filename(const char *name)
{
    size_t i;
    size_t len = strlen(name);

    if (len < 5 || len > 255) {
        return 0;
    }
    if (strstr(name, "..") != NULL || strchr(name, '/') != NULL || strchr(name, '\\') != NULL) {
        return 0;
    }
    if (strcmp(name + len - 4, ".inp") != 0) {
        return 0;
    }

    for (i = 0; i < len; ++i) {
        if (!(isalnum((unsigned char) name[i]) || name[i] == '_' || name[i] == '-' || name[i] == '.')) {
            return 0;
        }
    }

    return 1;
}

static int is_safe_root(const char *root)
{
    size_t i;
    size_t len = strlen(root);

    if (len == 0 || len > 120) {
        return 0;
    }
    for (i = 0; i < len; ++i) {
        if (!(isalnum((unsigned char) root[i]) || root[i] == '_' || root[i] == '-')) {
            return 0;
        }
    }
    return 1;
}

static char *replace_all_occurrences(const char *text, const char *needle, const char *replacement)
{
    const char *cursor = text;
    const char *match;
    size_t needle_len = strlen(needle);
    size_t repl_len = strlen(replacement);
    size_t count = 0;
    size_t new_len;
    char *result;
    char *out;

    if (needle_len == 0) {
        return strdup(text);
    }

    while ((match = strstr(cursor, needle)) != NULL) {
        ++count;
        cursor = match + needle_len;
    }

    new_len = strlen(text) + count * (repl_len - needle_len);
    result = (char *) malloc(new_len + 1);
    if (result == NULL) {
        return NULL;
    }

    cursor = text;
    out = result;
    while ((match = strstr(cursor, needle)) != NULL) {
        size_t chunk = (size_t) (match - cursor);
        memcpy(out, cursor, chunk);
        out += chunk;
        memcpy(out, replacement, repl_len);
        out += repl_len;
        cursor = match + needle_len;
    }
    strcpy(out, cursor);
    return result;
}

static int apply_replacements(const char *template_content, Replacement *replacements, int count, char **output)
{
    char *current = strdup(template_content);
    int i;

    if (current == NULL) {
        return -1;
    }

    for (i = 0; i < count; ++i) {
        char *next = replace_all_occurrences(current, replacements[i].key, replacements[i].value);
        free(current);
        if (next == NULL) {
            return -1;
        }
        current = next;
    }

    *output = current;
    return 0;
}

static int capture_child_output(pid_t child, int read_fd, char **output, int *exit_code)
{
    size_t capacity = READ_CHUNK;
    size_t used = 0;
    char *buffer = (char *) malloc(capacity);
    int status = 0;

    if (buffer == NULL) {
        close(read_fd);
        waitpid(child, &status, 0);
        return -1;
    }

    for (;;) {
        ssize_t current;
        if (used + READ_CHUNK + 1 > capacity) {
            char *next = (char *) realloc(buffer, capacity * 2);
            if (next == NULL) {
                free(buffer);
                close(read_fd);
                waitpid(child, &status, 0);
                return -1;
            }
            buffer = next;
            capacity *= 2;
        }

        current = read(read_fd, buffer + used, capacity - used - 1);
        if (current < 0) {
            if (errno == EINTR) {
                continue;
            }
            free(buffer);
            close(read_fd);
            waitpid(child, &status, 0);
            return -1;
        }
        if (current == 0) {
            break;
        }
        used += (size_t) current;
    }

    close(read_fd);
    waitpid(child, &status, 0);
    buffer[used] = '\0';
    *output = buffer;
    *exit_code = WIFEXITED(status) ? WEXITSTATUS(status) : 1;
    return 0;
}

static int run_chemdb(char **args, int arg_count, char **output, int *exit_code)
{
    const char *reactroot = reactroot_env();
    char path_buffer[MAX_PATH_LENGTH];
    char **argv;
    int pipefd[2];
    pid_t child;
    int i;

    if (snprintf(path_buffer, sizeof(path_buffer), "%s/bin/chemdb", reactroot) >= (int) sizeof(path_buffer)) {
        return -1;
    }

    argv = (char **) calloc((size_t) arg_count + 2, sizeof(char *));
    if (argv == NULL) {
        return -1;
    }

    argv[0] = path_buffer;
    for (i = 0; i < arg_count; ++i) {
        argv[i + 1] = args[i];
    }
    argv[arg_count + 1] = NULL;

    if (pipe(pipefd) != 0) {
        free(argv);
        return -1;
    }

    child = fork();
    if (child < 0) {
        close(pipefd[0]);
        close(pipefd[1]);
        free(argv);
        return -1;
    }

    if (child == 0) {
        dup2(pipefd[1], STDOUT_FILENO);
        dup2(pipefd[1], STDERR_FILENO);
        close(pipefd[0]);
        close(pipefd[1]);
        execv(path_buffer, argv);
        perror("execv");
        _exit(127);
    }

    close(pipefd[1]);
    free(argv);
    return capture_child_output(child, pipefd[0], output, exit_code);
}

static int run_chem_template(const char *root, const char *input_file_path, char **output, int *exit_code)
{
    const char *reactroot = reactroot_env();
    char runchem_path[MAX_PATH_LENGTH];
    char tmp_dir[MAX_PATH_LENGTH];
    int in_fd;
    int pipefd[2];
    pid_t child;
    char *argv[3];

    if (snprintf(runchem_path, sizeof(runchem_path), "%s/bin/runchem.sh", reactroot) >= (int) sizeof(runchem_path)) {
        return -1;
    }
    if (snprintf(tmp_dir, sizeof(tmp_dir), "%s/tmp", reactroot) >= (int) sizeof(tmp_dir)) {
        return -1;
    }

    in_fd = open(input_file_path, O_RDONLY);
    if (in_fd < 0) {
        return -1;
    }
    if (pipe(pipefd) != 0) {
        close(in_fd);
        return -1;
    }

    argv[0] = runchem_path;
    argv[1] = (char *) root;
    argv[2] = NULL;

    child = fork();
    if (child < 0) {
        close(in_fd);
        close(pipefd[0]);
        close(pipefd[1]);
        return -1;
    }

    if (child == 0) {
        dup2(in_fd, STDIN_FILENO);
        dup2(pipefd[1], STDOUT_FILENO);
        dup2(pipefd[1], STDERR_FILENO);
        close(in_fd);
        close(pipefd[0]);
        close(pipefd[1]);
        chdir(tmp_dir);
        execv(runchem_path, argv);
        perror("execv");
        _exit(127);
    }

    close(in_fd);
    close(pipefd[1]);
    return capture_child_output(child, pipefd[0], output, exit_code);
}

static int parse_commands_array(const char *body, char **commands, int *command_count, int max_cmds)
{
    const char *cmds_key = strstr(body, "\"commands\"");
    const char *cursor;
    int count = 0;

    if (cmds_key == NULL) {
        return -1;
    }

    cursor = strchr(cmds_key, ':');
    if (cursor == NULL) {
        return -1;
    }
    ++cursor;
    skip_whitespace(&cursor);

    if (*cursor != '[') {
        return -1;
    }
    ++cursor;

    for (;;) {
        skip_whitespace(&cursor);

        if (*cursor == ']') {
            ++cursor;
            break;
        }

        if (count >= max_cmds) {
            return -1;
        }

        commands[count] = parse_json_string(&cursor);
        if (commands[count] == NULL) {
            return -1;
        }
        ++count;

        skip_whitespace(&cursor);
        if (*cursor == ',') {
            ++cursor;
            continue;
        }
        if (*cursor == ']') {
            ++cursor;
            break;
        }
        return -1;
    }

    *command_count = count;
    return count > 0 ? 0 : -1;
}

static int prepare_context_file(const char *tmp_dir, const char *target_item, const char *task_id, const char *root)
{
    const char *reactroot = reactroot_env();
    char mol_path[MAX_PATH_LENGTH];
    char rxn_path[MAX_PATH_LENGTH];
    char mech_lst_path[MAX_PATH_LENGTH];
    char tables_mech_lst_path[MAX_PATH_LENGTH];
    char benson_lst_path[MAX_PATH_LENGTH];
    char benson_tables_dir[MAX_PATH_LENGTH];
    char content[1024];

    if (task_id != NULL && (strstr(task_id, "benson") != NULL || strcmp(task_id, "benson-groups") == 0)) {
        const char *item = (target_item != NULL && *target_item != '\0') ? target_item : "TableA.1";
        if (snprintf(benson_tables_dir, sizeof(benson_tables_dir), "%s/data/tables", reactroot) >= (int) sizeof(benson_tables_dir) ||
            snprintf(benson_lst_path, sizeof(benson_lst_path), "%s/data/tables/BensonStandard.lst", reactroot) >= (int) sizeof(benson_lst_path)) {
            return -1;
        }
        ensure_directory_exists(benson_tables_dir);
        snprintf(content, sizeof(content), "BensonAtomKeys\n%s\n", item);
        return write_text_file(benson_lst_path, content);
    }

    if (target_item == NULL || *target_item == '\0') {
        return 0;
    }

    if (task_id != NULL && (strstr(task_id, "mech") != NULL || strcmp(task_id, "mechanisms") == 0)) {
        const char *lst_name = (root != NULL && *root != '\0') ? root : target_item;
        snprintf(content, sizeof(content), "%s\n", target_item);

        snprintf(mech_lst_path, sizeof(mech_lst_path), "%s/%s.lst", tmp_dir, lst_name);
        write_text_file(mech_lst_path, content);

        snprintf(benson_tables_dir, sizeof(benson_tables_dir), "%s/data/tables", reactroot);
        ensure_directory_exists(benson_tables_dir);
        snprintf(tables_mech_lst_path, sizeof(tables_mech_lst_path), "%s/data/tables/%s.lst", reactroot, lst_name);
        write_text_file(tables_mech_lst_path, content);
        return 0;
    }

    if (task_id != NULL && strstr(task_id, "rxn") != NULL) {
        if (snprintf(rxn_path, sizeof(rxn_path), "%s/xxx.rxn", tmp_dir) >= (int) sizeof(rxn_path)) {
            return -1;
        }
        snprintf(content, sizeof(content), "RxnPatternList\n%s\n", target_item);
        return write_text_file(rxn_path, content);
    } else {
        if (snprintf(mol_path, sizeof(mol_path), "%s/xxx.mol", tmp_dir) >= (int) sizeof(mol_path)) {
            return -1;
        }
        snprintf(content, sizeof(content), "%s\n", target_item);
        return write_text_file(mol_path, content);
    }
}

static int run_chem_commands(const char *root, char **commands, int command_count, const char *target_item, const char *task_id, char **output, int *exit_code)
{
    const char *reactroot = reactroot_env();
    char runchem_path[MAX_PATH_LENGTH];
    char tmp_dir[MAX_PATH_LENGTH];
    int stdin_pipe[2];
    int out_pipe[2];
    pid_t child;
    char *argv[3];
    int i;
    size_t total_buf_len = 0;
    char *input_buffer = NULL;
    char *cursor = NULL;

    if (snprintf(runchem_path, sizeof(runchem_path), "%s/bin/runchem.sh", reactroot) >= (int) sizeof(runchem_path) ||
        snprintf(tmp_dir, sizeof(tmp_dir), "%s/tmp", reactroot) >= (int) sizeof(tmp_dir)) {
        return -1;
    }

    ensure_directory_exists(tmp_dir);
    if (root != NULL) {
        char old_file[MAX_PATH_LENGTH];
        if (snprintf(old_file, sizeof(old_file), "%s/%s.out", tmp_dir, root) < (int) sizeof(old_file)) unlink(old_file);
        if (snprintf(old_file, sizeof(old_file), "%s/%s.mech", tmp_dir, root) < (int) sizeof(old_file)) unlink(old_file);
        if (snprintf(old_file, sizeof(old_file), "%s/%s.sdf", tmp_dir, root) < (int) sizeof(old_file)) unlink(old_file);
        if (snprintf(old_file, sizeof(old_file), "%s/%s.thm", tmp_dir, root) < (int) sizeof(old_file)) unlink(old_file);
        if (snprintf(old_file, sizeof(old_file), "%s/%s.corrs", tmp_dir, root) < (int) sizeof(old_file)) unlink(old_file);
    }
    if (prepare_context_file(tmp_dir, target_item, task_id, root) != 0) {
        return -1;
    }

    for (i = 0; i < command_count; ++i) {
        total_buf_len += strlen(commands[i]) + 1;
    }

    input_buffer = (char *) malloc(total_buf_len + 1);
    if (input_buffer == NULL) {
        return -1;
    }

    cursor = input_buffer;
    for (i = 0; i < command_count; ++i) {
        size_t len = strlen(commands[i]);
        memcpy(cursor, commands[i], len);
        cursor += len;
        *cursor++ = '\n';
    }
    *cursor = '\0';

    if (pipe(stdin_pipe) != 0) {
        free(input_buffer);
        return -1;
    }
    if (pipe(out_pipe) != 0) {
        close(stdin_pipe[0]);
        close(stdin_pipe[1]);
        free(input_buffer);
        return -1;
    }

    argv[0] = runchem_path;
    argv[1] = (char *) root;
    argv[2] = NULL;

    child = fork();
    if (child < 0) {
        close(stdin_pipe[0]);
        close(stdin_pipe[1]);
        close(out_pipe[0]);
        close(out_pipe[1]);
        free(input_buffer);
        return -1;
    }

    if (child == 0) {
        dup2(stdin_pipe[0], STDIN_FILENO);
        dup2(out_pipe[1], STDOUT_FILENO);
        dup2(out_pipe[1], STDERR_FILENO);
        close(stdin_pipe[0]);
        close(stdin_pipe[1]);
        close(out_pipe[0]);
        close(out_pipe[1]);
        chdir(tmp_dir);
        execv(runchem_path, argv);
        perror("execv");
        _exit(127);
    }

    close(stdin_pipe[0]);
    close(out_pipe[1]);

    if (total_buf_len > 0) {
        send_all(stdin_pipe[1], input_buffer, total_buf_len);
    }
    close(stdin_pipe[1]);
    free(input_buffer);

    int res = capture_child_output(child, out_pipe[0], output, exit_code);
    if (res == 0 && root != NULL) {
        char gen_file_path[MAX_PATH_LENGTH];
        int is_mech_task = (task_id != NULL && (strstr(task_id, "mech") != NULL || strcmp(task_id, "mechanisms") == 0));

        if (is_mech_task) {
            char *mech_content = NULL;
            char *sdf_content = NULL;
            char *thm_content = NULL;
            char *corrs_content = NULL;
            char *out_content = NULL;

            snprintf(gen_file_path, sizeof(gen_file_path), "%s/%s.mech", tmp_dir, root);
            read_text_file(gen_file_path, &mech_content);

            snprintf(gen_file_path, sizeof(gen_file_path), "%s/%s.sdf", tmp_dir, root);
            read_text_file(gen_file_path, &sdf_content);

            snprintf(gen_file_path, sizeof(gen_file_path), "%s/%s.thm", tmp_dir, root);
            read_text_file(gen_file_path, &thm_content);

            snprintf(gen_file_path, sizeof(gen_file_path), "%s/%s.corrs", tmp_dir, root);
            read_text_file(gen_file_path, &corrs_content);

            snprintf(gen_file_path, sizeof(gen_file_path), "%s/%s.out", tmp_dir, root);
            read_text_file(gen_file_path, &out_content);

            if (mech_content != NULL || sdf_content != NULL || thm_content != NULL || corrs_content != NULL) {
                size_t total_len = 512;
                if (mech_content) total_len += strlen(mech_content);
                if (sdf_content) total_len += strlen(sdf_content);
                if (thm_content) total_len += strlen(thm_content);
                if (corrs_content) total_len += strlen(corrs_content);
                if (out_content) total_len += strlen(out_content);
                else if (*output) total_len += strlen(*output);

                char *combined = (char *) calloc(1, total_len + 1);
                if (combined != NULL) {
                    if (mech_content) {
                        strcat(combined, "--- Mechanism Reactions ---\n");
                        strcat(combined, mech_content);
                        strcat(combined, "\n");
                    }
                    if (sdf_content) {
                        strcat(combined, "--- Molecule Structures ---\n");
                        strcat(combined, sdf_content);
                        strcat(combined, "\n");
                    }
                    if (thm_content) {
                        strcat(combined, "--- Molecule Thermodynamics ---\n");
                        strcat(combined, thm_content);
                        strcat(combined, "\n");
                    }
                    if (corrs_content) {
                        strcat(combined, "--- Name Correspondences ---\n");
                        strcat(combined, corrs_content);
                        strcat(combined, "\n");
                    }
                    if (out_content) {
                        strcat(combined, "--- Execution Log ---\n");
                        strcat(combined, out_content);
                    } else if (*output && **output) {
                        strcat(combined, "--- Execution Log ---\n");
                        strcat(combined, *output);
                    }
                    free(*output);
                    *output = combined;
                }
            }
            if (mech_content) free(mech_content);
            if (sdf_content) free(sdf_content);
            if (thm_content) free(thm_content);
            if (corrs_content) free(corrs_content);
            if (out_content) free(out_content);
        } else {
            char *out_content = NULL;
            snprintf(gen_file_path, sizeof(gen_file_path), "%s/%s.out", tmp_dir, root);
            if (read_text_file(gen_file_path, &out_content) == 0 && out_content != NULL) {
                size_t total_len = strlen(*output) + strlen(out_content) + 128;
                char *combined = (char *) malloc(total_len);
                if (combined != NULL) {
                    snprintf(combined, total_len, "%s\n--- Output File (%s.out) ---\n%s", *output, root, out_content);
                    free(*output);
                    *output = combined;
                }
                free(out_content);
            }
        }
    }

    return res;
}

static int handle_run_commands_request(int client_fd, const char *body)
{
    char *commands[MAX_ARGS * 4];
    int command_count = 0;
    char *root = NULL;
    char *target_item = NULL;
    char *task_id = NULL;
    char *command_output = NULL;
    char *escaped_output = NULL;
    char *response = NULL;
    int exit_code = 1;
    int status;
    int i;

    for (i = 0; i < MAX_ARGS * 4; ++i) {
        commands[i] = NULL;
    }

    status = parse_commands_array(body, commands, &command_count, MAX_ARGS * 4);
    if (status != 0 || command_count == 0) {
        return send_response(
            client_fd,
            400,
            "application/json",
            "{\"error\":\"Request body must be JSON with a non-empty commands array, for example {\\\"commands\\\":[\\\"CreateOpenClose\\\",\\\"Start\\\",\\\"Quit\\\"]}.\"}");
    }

    status = parse_json_field_string(body, "root", &root);
    if (status < 0) {
        free_args(commands, command_count);
        return send_response(client_fd, 400, "application/json", "{\"error\":\"Invalid root value.\"}");
    }
    if (root == NULL) {
        root = strdup("api");
    }
    if (!is_safe_root(root)) {
        free(root);
        free_args(commands, command_count);
        return send_response(client_fd, 400, "application/json", "{\"error\":\"root must use letters, numbers, underscore, or dash.\"}");
    }

    parse_json_field_string(body, "targetItem", &target_item);
    parse_json_field_string(body, "taskId", &task_id);

    if (run_chem_commands(root, commands, command_count, target_item, task_id, &command_output, &exit_code) != 0) {
        if (target_item) free(target_item);
        if (task_id) free(task_id);
        free(root);
        free_args(commands, command_count);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to execute commands stream.\"}");
    }

    if (target_item) free(target_item);
    if (task_id) free(task_id);

    escaped_output = json_escape(command_output);
    free(command_output);
    free_args(commands, command_count);

    if (escaped_output == NULL) {
        free(root);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to encode output.\"}");
    }

    response = build_json_message(
        "{\"root\":\"%s\",\"exitCode\":%d,\"output\":\"%s\"}",
        root,
        exit_code,
        escaped_output);

    free(root);
    free(escaped_output);

    if (response == NULL) {
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to build response.\"}");
    }

    status = send_response(client_fd, 200, "application/json", response);
    free(response);
    return status;
}

static int create_server_socket(int port)
{
    int server_fd;
    int enable = 1;
    struct sockaddr_in address;

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        return -1;
    }

    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(enable));

    memset(&address, 0, sizeof(address));
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_ANY);
    address.sin_port = htons((unsigned short) port);

    if (bind(server_fd, (struct sockaddr *) &address, sizeof(address)) != 0) {
        close(server_fd);
        return -1;
    }

    if (listen(server_fd, 16) != 0) {
        close(server_fd);
        return -1;
    }

    return server_fd;
}

static int handle_run_request(int client_fd, const char *body)
{
    char *args[MAX_ARGS];
    int arg_count = 0;
    char *command_output = NULL;
    char *escaped_output = NULL;
    char *response = NULL;
    int exit_code = 1;
    int i;

    for (i = 0; i < MAX_ARGS; ++i) {
        args[i] = NULL;
    }

    if (parse_args_array(body, args, &arg_count) != 0) {
        return send_response(
            client_fd,
            400,
            "application/json",
            "{\"error\":\"Request body must be JSON with a non-empty args array, for example {\\\"args\\\":[\\\"--help\\\"]}.\"}");
    }

    if (run_chemdb(args, arg_count, &command_output, &exit_code) != 0) {
        free_args(args, arg_count);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to execute chemdb.\"}");
    }

    escaped_output = json_escape(command_output);
    free(command_output);
    free_args(args, arg_count);
    if (escaped_output == NULL) {
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to encode chemdb output.\"}");
    }

    response = build_json_message("{\"exitCode\":%d,\"output\":\"%s\"}", exit_code, escaped_output);
    free(escaped_output);
    if (response == NULL) {
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to build response.\"}");
    }

    i = send_response(client_fd, 200, "application/json", response);
    free(response);
    return i;
}

static int handle_run_input_request(int client_fd, const char *body)
{
    const char *reactroot = reactroot_env();
    Replacement replacements[MAX_REPLACEMENTS];
    int replacement_count = 0;
    char *input_file = NULL;
    char *root = NULL;
    char template_path[MAX_PATH_LENGTH];
    char temp_input_path[MAX_PATH_LENGTH];
    char tmp_dir[MAX_PATH_LENGTH];
    char *template_content = NULL;
    char *prepared_input = NULL;
    char *command_output = NULL;
    char *escaped_output = NULL;
    char *response = NULL;
    int exit_code = 1;
    int status;

    status = parse_json_field_string(body, "inputFile", &input_file);
    if (status != 0 || input_file == NULL) {
        return send_response(
            client_fd,
            400,
            "application/json",
            "{\"error\":\"Request must include inputFile, for example {\\\"inputFile\\\":\\\"PrintRxnPatternsList.inp\\\"}.\"}");
    }

    status = parse_json_field_string(body, "root", &root);
    if (status < 0) {
        free(input_file);
        return send_response(client_fd, 400, "application/json", "{\"error\":\"Invalid root value.\"}");
    }
    if (root == NULL) {
        root = strdup("api");
        if (root == NULL) {
            free(input_file);
            return send_response(client_fd, 500, "application/json", "{\"error\":\"Out of memory.\"}");
        }
    }

    if (!is_safe_input_filename(input_file)) {
        free(input_file);
        free(root);
        return send_response(client_fd, 400, "application/json", "{\"error\":\"inputFile must be a safe .inp filename.\"}");
    }
    if (!is_safe_root(root)) {
        free(input_file);
        free(root);
        return send_response(client_fd, 400, "application/json", "{\"error\":\"root must use letters, numbers, underscore, or dash.\"}");
    }

    if (parse_replacements_object(body, replacements, &replacement_count) != 0) {
        free(input_file);
        free(root);
        return send_response(client_fd, 400, "application/json", "{\"error\":\"Invalid replacements object.\"}");
    }

    if (snprintf(template_path, sizeof(template_path), "%s/programs/inputs/%s", reactroot, input_file) >= (int) sizeof(template_path) ||
        snprintf(tmp_dir, sizeof(tmp_dir), "%s/tmp", reactroot) >= (int) sizeof(tmp_dir) ||
        snprintf(temp_input_path, sizeof(temp_input_path), "%s/tmp/%s.api.inp", reactroot, root) >= (int) sizeof(temp_input_path)) {
        free(input_file);
        free(root);
        free_replacements(replacements, replacement_count);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Path too long.\"}");
    }

    if (read_text_file(template_path, &template_content) != 0) {
        free(input_file);
        free(root);
        free_replacements(replacements, replacement_count);
        return send_response(client_fd, 404, "application/json", "{\"error\":\"Template input file not found.\"}");
    }

    if (apply_replacements(template_content, replacements, replacement_count, &prepared_input) != 0) {
        free(input_file);
        free(root);
        free_replacements(replacements, replacement_count);
        free(template_content);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to prepare template input.\"}");
    }

    if (ensure_directory_exists(tmp_dir) != 0) {
        free(input_file);
        free(root);
        free_replacements(replacements, replacement_count);
        free(template_content);
        free(prepared_input);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to prepare temp directory.\"}");
    }

    if (write_text_file(temp_input_path, prepared_input) != 0) {
        free(input_file);
        free(root);
        free_replacements(replacements, replacement_count);
        free(template_content);
        free(prepared_input);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to write temp input file.\"}");
    }

    if (run_chem_template(root, temp_input_path, &command_output, &exit_code) != 0) {
        unlink(temp_input_path);
        free(input_file);
        free(root);
        free_replacements(replacements, replacement_count);
        free(template_content);
        free(prepared_input);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to execute runchem template flow.\"}");
    }

    unlink(temp_input_path);

    escaped_output = json_escape(command_output);
    if (escaped_output == NULL) {
        free(input_file);
        free(root);
        free_replacements(replacements, replacement_count);
        free(template_content);
        free(prepared_input);
        free(command_output);
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to encode output.\"}");
    }

    response = build_json_message(
        "{\"inputFile\":\"%s\",\"root\":\"%s\",\"exitCode\":%d,\"output\":\"%s\"}",
        input_file,
        root,
        exit_code,
        escaped_output);

    free(input_file);
    free(root);
    free_replacements(replacements, replacement_count);
    free(template_content);
    free(prepared_input);
    free(command_output);
    free(escaped_output);

    if (response == NULL) {
        return send_response(client_fd, 500, "application/json", "{\"error\":\"Unable to build response.\"}");
    }

    status = send_response(client_fd, 200, "application/json", response);
    free(response);
    return status;
}

static int is_authenticated(char *request_headers)
{
    char *auth = find_header_value(request_headers, "Authorization");
    if (auth != NULL && *auth != '\0') {
        if (strncasecmp(auth, "Bearer ", 7) == 0 && strlen(auth) > 7) {
            return 1;
        }
    }
    char *goog_email = find_header_value(request_headers, "X-Goog-Authenticated-User-Email");
    if (goog_email != NULL && *goog_email != '\0') {
        return 1;
    }
    return 0;
}

static int handle_request(int client_fd)
{
    char *request = NULL;
    size_t request_length = 0;
    size_t header_end = 0;
    char method[16];
    char path[256];
    char *body;
    int result;

    if (read_request(client_fd, &request, &request_length, &header_end) != 0) {
        return send_response(client_fd, 400, "application/json", "{\"error\":\"Invalid HTTP request.\"}");
    }

    if (sscanf(request, "%15s %255s", method, path) != 2) {
        free(request);
        return send_response(client_fd, 400, "application/json", "{\"error\":\"Unable to parse request line.\"}");
    }

    body = request + header_end;
    (void) request_length;

    if (strcmp(method, "OPTIONS") == 0) {
        result = send_response(client_fd, 200, "text/plain", "");
    } else if (strcmp(method, "GET") == 0 && strcmp(path, "/health") == 0) {
        result = send_response(client_fd, 200, "application/json", "{\"status\":\"ok\",\"service\":\"chemdb\"}");
    } else if (strcmp(method, "GET") == 0 && strcmp(path, "/") == 0) {
        result = send_response(
            client_fd,
            200,
            "application/json",
            "{\"service\":\"chemdb\",\"endpoints\":[\"GET /health\",\"POST /api/run\",\"POST /api/run-input\",\"POST /api/run-commands\"],"
            "\"examples\":{\"run\":{\"args\":[\"--help\"]},\"runInput\":{\"inputFile\":\"PrintRxnPatternsList.inp\",\"root\":\"job1\"},\"runCommands\":{\"commands\":[\"CreateOpenClose\",\"Start\",\"Quit\"]}}}");
    } else if (strcmp(method, "POST") == 0 && (strcmp(path, "/api/run") == 0 || strcmp(path, "/api/run-input") == 0 || strcmp(path, "/api/run-commands") == 0)) {
        if (!is_authenticated(request)) {
            result = send_response(
                client_fd,
                401,
                "application/json",
                "{\"error\":\"Authentication required. Please provide a valid Authorization Bearer token.\"}");
        } else if (strcmp(path, "/api/run") == 0) {
            result = handle_run_request(client_fd, body);
        } else if (strcmp(path, "/api/run-input") == 0) {
            result = handle_run_input_request(client_fd, body);
        } else {
            result = handle_run_commands_request(client_fd, body);
        }
    } else if (strcmp(method, "GET") != 0 && strcmp(method, "POST") != 0 && strcmp(method, "OPTIONS") != 0) {
        result = send_response(client_fd, 405, "application/json", "{\"error\":\"Method not allowed.\"}");
    } else {
        result = send_response(client_fd, 404, "application/json", "{\"error\":\"Endpoint not found.\"}");
    }

    free(request);
    return result;
}

int main(int argc, char *argv[])
{
    int port = DEFAULT_PORT;
    int server_fd;
    int i;

    for (i = 1; i < argc; ++i) {
        if (strcmp(argv[i], "--port") == 0 && i + 1 < argc) {
            port = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--help") == 0) {
            printf("Usage: %s [--port PORT]\n", argv[0]);
            return 0;
        }
    }

    if (port <= 0) {
        fprintf(stderr, "Invalid port: %d\n", port);
        return 1;
    }

    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);

    server_fd = create_server_socket(port);
    if (server_fd < 0) {
        perror("create_server_socket");
        return 1;
    }

    printf("chemdb HTTP server listening on port %d\n", port);
    fflush(stdout);

    while (keep_running) {
        int client_fd = accept(server_fd, NULL, NULL);
        if (client_fd < 0) {
            if (errno == EINTR) {
                continue;
            }
            perror("accept");
            close(server_fd);
            return 1;
        }

        handle_request(client_fd);
        close(client_fd);
    }

    close(server_fd);
    return 0;
}
