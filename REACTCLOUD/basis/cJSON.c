/*
  Copyright (c) 2009-2017 Dave Gamble and cJSON contributors

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
  CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

#include <string.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <limits.h>
#include <ctype.h>
#include <float.h>

#include "cJSON.h"

static void *(*cJSON_malloc_func)(size_t sz) = malloc;
static void (*cJSON_free_func)(void *ptr) = free;

void *cJSON_malloc(size_t size) { return cJSON_malloc_func(size); }
void cJSON_free(void *object) { cJSON_free_func(object); }

static char* cJSON_strdup(const char* string) {
    size_t length;
    char *copy;
    if (string == NULL) return NULL;
    length = strlen(string) + 1;
    copy = (char*)cJSON_malloc_func(length);
    if (copy == NULL) return NULL;
    memcpy(copy, string, length);
    return copy;
}

void cJSON_InitHooks(cJSON_Hooks* hooks) {
    if (!hooks) {
        cJSON_malloc_func = malloc;
        cJSON_free_func = free;
        return;
    }
    cJSON_malloc_func = (hooks->malloc_fn) ? hooks->malloc_fn : malloc;
    cJSON_free_func = (hooks->free_fn) ? hooks->free_fn : free;
}

static cJSON *cJSON_New_Item(void) {
    cJSON* node = (cJSON*)cJSON_malloc_func(sizeof(cJSON));
    if (node) memset(node, 0, sizeof(cJSON));
    return node;
}

void cJSON_Delete(cJSON *item) {
    cJSON *next = NULL;
    while (item) {
        next = item->next;
        if (!(item->type & cJSON_IsReference) && item->child) cJSON_Delete(item->child);
        if (!(item->type & cJSON_IsReference) && item->valuestring) cJSON_free(item->valuestring);
        if (!(item->type & cJSON_StringIsConst) && item->string) cJSON_free(item->string);
        cJSON_free(item);
        item = next;
    }
}

static const char *parse_number(cJSON *item, const char *num) {
    double n = 0, sign = 1, scale = 0;
    int subscale = 0, signsubscale = 1;

    if (*num == '-') sign = -1, num++;
    if (*num == '0') num++;
    if (*num >= '1' && *num <= '9') do n = (n * 10.0) + (*num++ - '0'); while (*num >= '0' && *num <= '9');
    if (*num == '.' && num[1] >= '0' && num[1] <= '9') {
        num++;
        do n = (n * 10.0) + (*num++ - '0'), scale--; while (*num >= '0' && *num <= '9');
    }
    if (*num == 'e' || *num == 'E') {
        num++;
        if (*num == '+') num++;
        else if (*num == '-') signsubscale = -1, num++;
        while (*num >= '0' && *num <= '9') subscale = (subscale * 10) + (*num++ - '0');
    }

    n = sign * n * pow(10.0, (scale + subscale * signsubscale));
    item->valuedouble = n;
    item->valueint = (int)n;
    item->type = cJSON_Number;
    return num;
}

static const char *parse_string(cJSON *item, const char *str) {
    const char *ptr = str + 1;
    char *ptr2;
    char *out;
    int len = 0;
    if (*str != '\"') return NULL;
    while (*ptr != '\"' && *ptr) {
        if (*ptr++ == '\\') ptr++;
        len++;
    }
    out = (char*)cJSON_malloc(len + 1);
    if (!out) return NULL;
    ptr = str + 1;
    ptr2 = out;
    while (*ptr != '\"' && *ptr) {
        if (*ptr != '\\') *ptr2++ = *ptr++;
        else {
            ptr++;
            switch (*ptr) {
                case 'b': *ptr2++ = '\b'; break;
                case 'f': *ptr2++ = '\f'; break;
                case 'n': *ptr2++ = '\n'; break;
                case 'r': *ptr2++ = '\r'; break;
                case 't': *ptr2++ = '\t'; break;
                default: *ptr2++ = *ptr; break;
            }
            ptr++;
        }
    }
    *ptr2 = 0;
    if (*ptr == '\"') ptr++;
    item->valuestring = out;
    item->type = cJSON_String;
    return ptr;
}

static const char *skip(const char *in) {
    while (in && *in && (unsigned char)*in <= 32) in++;
    return in;
}

static const char *parse_value(cJSON *item, const char *value);
static const char *parse_array(cJSON *item, const char *value);
static const char *parse_object(cJSON *item, const char *value);

static const char *parse_value(cJSON *item, const char *value) {
    if (!value) return NULL;
    if (!strncmp(value, "null", 4)) { item->type = cJSON_NULL; return value + 4; }
    if (!strncmp(value, "false", 5)) { item->type = cJSON_False; return value + 5; }
    if (!strncmp(value, "true", 4)) { item->type = cJSON_True; item->valueint = 1; return value + 4; }
    if (*value == '\"') return parse_string(item, value);
    if (*value == '-' || (*value >= '0' && *value <= '9')) return parse_number(item, value);
    if (*value == '[') return parse_array(item, value);
    if (*value == '{') return parse_object(item, value);
    return NULL;
}

static const char *parse_array(cJSON *item, const char *value) {
    cJSON *child;
    if (*value != '[') return NULL;
    item->type = cJSON_Array;
    value = skip(value + 1);
    if (*value == ']') return value + 1;

    item->child = child = cJSON_New_Item();
    if (!item->child) return NULL;
    value = skip(parse_value(child, skip(value)));
    if (!value) return NULL;

    while (*value == ',') {
        cJSON *new_item = cJSON_New_Item();
        if (!new_item) return NULL;
        child->next = new_item;
        new_item->prev = child;
        child = new_item;
        value = skip(parse_value(child, skip(value + 1)));
        if (!value) return NULL;
    }
    if (*value == ']') return value + 1;
    return NULL;
}

static const char *parse_object(cJSON *item, const char *value) {
    cJSON *child;
    if (*value != '{') return NULL;
    item->type = cJSON_Object;
    value = skip(value + 1);
    if (*value == '}') return value + 1;

    item->child = child = cJSON_New_Item();
    if (!item->child) return NULL;
    value = skip(parse_string(child, skip(value)));
    if (!value) return NULL;
    child->string = child->valuestring;
    child->valuestring = NULL;
    if (*value != ':') return NULL;
    value = skip(parse_value(child, skip(value + 1)));
    if (!value) return NULL;

    while (*value == ',') {
        cJSON *new_item = cJSON_New_Item();
        if (!new_item) return NULL;
        child->next = new_item;
        new_item->prev = child;
        child = new_item;
        value = skip(parse_string(child, skip(value + 1)));
        if (!value) return NULL;
        child->string = child->valuestring;
        child->valuestring = NULL;
        if (*value != ':') return NULL;
        value = skip(parse_value(child, skip(value + 1)));
        if (!value) return NULL;
    }
    if (*value == '}') return value + 1;
    return NULL;
}

cJSON *cJSON_Parse(const char *value) {
    return cJSON_ParseWithOpts(value, 0, 0);
}

cJSON *cJSON_ParseWithOpts(const char *value, const char **return_parse_end, cJSON_bool require_null_terminated) {
    const char *end = 0;
    cJSON *c = cJSON_New_Item();
    if (!c) return NULL;
    end = parse_value(c, skip(value));
    if (!end) { cJSON_Delete(c); return NULL; }
    if (require_null_terminated) {
        end = skip(end);
        if (*end) { cJSON_Delete(c); return NULL; }
    }
    if (return_parse_end) *return_parse_end = end;
    return c;
}

static char *print_number(const cJSON *item) {
    char *str = (char*)cJSON_malloc(64);
    if (!str) return NULL;
    if (fabs(((double)item->valueint) - item->valuedouble) <= DBL_EPSILON && item->valuedouble >= INT_MIN && item->valuedouble <= INT_MAX) {
        sprintf(str, "%d", item->valueint);
    } else {
        sprintf(str, "%f", item->valuedouble);
    }
    return str;
}

static char *print_string_ptr(const char *str) {
    const char *ptr;
    char *ptr2, *out;
    int len = 0;
    if (!str) return cJSON_strdup("");
    for (ptr = str; *ptr; ptr++) {
        if ((unsigned char)*ptr < 32 || *ptr == '\"' || *ptr == '\\') len += 2;
        else len++;
    }
    out = (char*)cJSON_malloc(len + 3);
    if (!out) return NULL;
    ptr2 = out;
    *ptr2++ = '\"';
    for (ptr = str; *ptr; ptr++) {
        if ((unsigned char)*ptr > 31 && *ptr != '\"' && *ptr != '\\') *ptr2++ = *ptr;
        else {
            *ptr2++ = '\\';
            switch (*ptr) {
                case '\\': *ptr2++ = '\\'; break;
                case '\"': *ptr2++ = '\"'; break;
                case '\b': *ptr2++ = 'b'; break;
                case '\f': *ptr2++ = 'f'; break;
                case '\n': *ptr2++ = 'n'; break;
                case '\r': *ptr2++ = 'r'; break;
                case '\t': *ptr2++ = 't'; break;
                default: sprintf(ptr2, "u%04x", *ptr); ptr2 += 5; break;
            }
        }
    }
    *ptr2++ = '\"';
    *ptr2 = 0;
    return out;
}

static char *print_value(const cJSON *item, int depth, cJSON_bool fmt);
static char *print_array(const cJSON *item, int depth, cJSON_bool fmt);
static char *print_object(const cJSON *item, int depth, cJSON_bool fmt);

static char *print_value(const cJSON *item, int depth, cJSON_bool fmt) {
    if (!item) return NULL;
    switch (item->type & 0xFF) {
        case cJSON_NULL: return cJSON_strdup("null");
        case cJSON_False: return cJSON_strdup("false");
        case cJSON_True: return cJSON_strdup("true");
        case cJSON_Number: return print_number(item);
        case cJSON_String: return print_string_ptr(item->valuestring);
        case cJSON_Array: return print_array(item, depth, fmt);
        case cJSON_Object: return print_object(item, depth, fmt);
    }
    return NULL;
}

static char *print_array(const cJSON *item, int depth, cJSON_bool fmt) {
    char **entries;
    char *out = NULL, *ptr, *ret;
    int len = 5, templen = 0;
    cJSON *child = item->child;
    int numentries = 0, i = 0, fail = 0;

    while (child) numentries++, child = child->next;
    if (!numentries) {
        out = (char*)cJSON_malloc(3);
        if (out) strcpy(out, "[]");
        return out;
    }
    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    if (!entries) return NULL;
    memset(entries, 0, numentries * sizeof(char*));

    child = item->child;
    while (child && !fail) {
        ret = print_value(child, depth + 1, fmt);
        entries[i++] = ret;
        if (ret) len += strlen(ret) + 2 + (fmt ? 1 : 0); else fail = 1;
        child = child->next;
    }
    if (!fail) {
        out = (char*)cJSON_malloc(len);
        if (out) {
            *out = '[';
            ptr = out + 1;
            *ptr = 0;
            for (i = 0; i < numentries; i++) {
                templen = strlen(entries[i]);
                memcpy(ptr, entries[i], templen);
                ptr += templen;
                if (i != numentries - 1) { *ptr++ = ','; if (fmt) *ptr++ = ' '; }
                cJSON_free(entries[i]);
            }
            cJSON_free(entries);
            *ptr++ = ']';
            *ptr = 0;
            return out;
        }
    }
    for (i = 0; i < numentries; i++) if (entries[i]) cJSON_free(entries[i]);
    cJSON_free(entries);
    return NULL;
}

static char *print_object(const cJSON *item, int depth, cJSON_bool fmt) {
    char **entries = NULL, **names = NULL;
    char *out = NULL, *ptr, *ret, *str;
    int len = 7, i = 0, j = 0, numentries = 0, fail = 0, templen = 0;
    cJSON *child = item->child;

    while (child) numentries++, child = child->next;
    if (!numentries) {
        out = (char*)cJSON_malloc(3);
        if (out) strcpy(out, "{}");
        return out;
    }
    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    names = (char**)cJSON_malloc(numentries * sizeof(char*));
    if (!entries || !names) { if (entries) cJSON_free(entries); if (names) cJSON_free(names); return NULL; }
    memset(entries, 0, numentries * sizeof(char*));
    memset(names, 0, numentries * sizeof(char*));

    child = item->child;
    depth++;
    while (child && !fail) {
        names[i] = str = print_string_ptr(child->string);
        entries[i] = ret = print_value(child, depth, fmt);
        if (str && ret) len += strlen(ret) + strlen(str) + 2 + (fmt ? 2 : 1); else fail = 1;
        i++;
        child = child->next;
    }
    if (!fail) {
        out = (char*)cJSON_malloc(len);
        if (out) {
            *out = '{';
            ptr = out + 1;
            if (fmt) *ptr++ = ' ';
            *ptr = 0;
            for (i = 0; i < numentries; i++) {
                templen = strlen(names[i]);
                memcpy(ptr, names[i], templen);
                ptr += templen;
                *ptr++ = ':';
                if (fmt) *ptr++ = ' ';
                templen = strlen(entries[i]);
                memcpy(ptr, entries[i], templen);
                ptr += templen;
                if (i != numentries - 1) { *ptr++ = ','; if (fmt) *ptr++ = ' '; }
                cJSON_free(names[i]);
                cJSON_free(entries[i]);
            }
            cJSON_free(names);
            cJSON_free(entries);
            if (fmt) *ptr++ = ' ';
            *ptr++ = '}';
            *ptr = 0;
            return out;
        }
    }
    for (i = 0; i < numentries; i++) {
        if (names[i]) cJSON_free(names[i]);
        if (entries[i]) cJSON_free(entries[i]);
    }
    cJSON_free(names);
    cJSON_free(entries);
    return NULL;
}

char *cJSON_Print(const cJSON *item) { return print_value(item, 0, 1); }
char *cJSON_PrintUnformatted(const cJSON *item) { return print_value(item, 0, 0); }

int cJSON_GetArraySize(const cJSON *array) {
    cJSON *c = array ? array->child : NULL;
    int i = 0;
    while (c) i++, c = c->next;
    return i;
}

cJSON *cJSON_GetArrayItem(const cJSON *array, int index) {
    cJSON *c = array ? array->child : NULL;
    while (c && index > 0) index--, c = c->next;
    return c;
}

cJSON *cJSON_GetObjectItem(const cJSON * const object, const char * const string) {
    cJSON *c = object ? object->child : NULL;
    while (c && c->string && strcasecmp(c->string, string)) c = c->next;
    return c;
}

cJSON *cJSON_GetObjectItemCaseSensitive(const cJSON * const object, const char * const string) {
    cJSON *c = object ? object->child : NULL;
    while (c && c->string && strcmp(c->string, string)) c = c->next;
    return c;
}

cJSON_bool cJSON_HasObjectItem(const cJSON *object, const char *string) {
    return cJSON_GetObjectItemCaseSensitive(object, string) != NULL;
}

cJSON_bool cJSON_IsNull(const cJSON * const item) { return (item == NULL) || ((item->type & 0xFF) == cJSON_NULL); }
cJSON_bool cJSON_IsNumber(const cJSON * const item) { return (item != NULL) && ((item->type & 0xFF) == cJSON_Number); }
cJSON_bool cJSON_IsString(const cJSON * const item) { return (item != NULL) && ((item->type & 0xFF) == cJSON_String); }
cJSON_bool cJSON_IsArray(const cJSON * const item) { return (item != NULL) && ((item->type & 0xFF) == cJSON_Array); }
cJSON_bool cJSON_IsObject(const cJSON * const item) { return (item != NULL) && ((item->type & 0xFF) == cJSON_Object); }

cJSON *cJSON_CreateNull(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_NULL; return item; }
cJSON *cJSON_CreateNumber(double num) {
    cJSON *item = cJSON_New_Item();
    if (item) { item->type = cJSON_Number; item->valuedouble = num; item->valueint = (int)num; }
    return item;
}
cJSON *cJSON_CreateString(const char *string) {
    cJSON *item = cJSON_New_Item();
    if (item) { item->type = cJSON_String; item->valuestring = cJSON_strdup(string); }
    return item;
}
cJSON *cJSON_CreateArray(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_Array; return item; }
cJSON *cJSON_CreateObject(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_Object; return item; }

cJSON_bool cJSON_AddItemToArray(cJSON *array, cJSON *item) {
    cJSON *c;
    if (!item || !array) return 0;
    c = array->child;
    if (!c) array->child = item;
    else { while (c && c->next) c = c->next; c->next = item; item->prev = c; }
    return 1;
}

cJSON_bool cJSON_AddItemToObject(cJSON *object, const char *string, cJSON *item) {
    if (!item) return 0;
    if (item->string) cJSON_free(item->string);
    item->string = cJSON_strdup(string);
    return cJSON_AddItemToArray(object, item);
}

cJSON *cJSON_AddNullToObject(cJSON * const object, const char * const name) {
    cJSON *null_item = cJSON_CreateNull();
    if (cJSON_AddItemToObject(object, name, null_item)) return null_item;
    cJSON_Delete(null_item);
    return NULL;
}

cJSON *cJSON_AddNumberToObject(cJSON * const object, const char * const name, const double number) {
    cJSON *number_item = cJSON_CreateNumber(number);
    if (cJSON_AddItemToObject(object, name, number_item)) return number_item;
    cJSON_Delete(number_item);
    return NULL;
}

cJSON *cJSON_AddStringToObject(cJSON * const object, const char * const name, const char * const string) {
    cJSON *string_item = cJSON_CreateString(string);
    if (cJSON_AddItemToObject(object, name, string_item)) return string_item;
    cJSON_Delete(string_item);
    return NULL;
}

cJSON *cJSON_AddObjectToObject(cJSON * const object, const char * const name) {
    cJSON *object_item = cJSON_CreateObject();
    if (cJSON_AddItemToObject(object, name, object_item)) return object_item;
    cJSON_Delete(object_item);
    return NULL;
}

cJSON *cJSON_AddArrayToObject(cJSON * const object, const char * const name) {
    cJSON *array_item = cJSON_CreateArray();
    if (cJSON_AddItemToObject(object, name, array_item)) return array_item;
    cJSON_Delete(array_item);
    return NULL;
}

char *cJSON_Base64Encode(const unsigned char *src, size_t len) {
    static const char b64table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    size_t out_len;
    char *out;
    size_t i, j;

    if (!src || len == 0) return NULL;
    out_len = 4 * ((len + 2) / 3);
    out = (char *)cJSON_malloc(out_len + 1);
    if (!out) return NULL;

    for (i = 0, j = 0; i < len;) {
        uint32_t octet_a = i < len ? src[i++] : 0;
        uint32_t octet_b = i < len ? src[i++] : 0;
        uint32_t octet_c = i < len ? src[i++] : 0;
        uint32_t triple = (octet_a << 16) | (octet_b << 8) | octet_c;

        out[j++] = b64table[(triple >> 18) & 0x3F];
        out[j++] = b64table[(triple >> 12) & 0x3F];
        out[j++] = (i > len + 1) ? '=' : b64table[(triple >> 6) & 0x3F];
        out[j++] = (i > len) ? '=' : b64table[triple & 0x3F];
    }
    out[j] = '\0';
    return out;
}

int cJSON_IsASCIIBuffer(const char *buf, size_t size) {
    size_t i;
    if (!buf || size == 0) return 0;
    for (i = 0; i < size; i++) {
        unsigned char c = (unsigned char)buf[i];
        if (c == 0) break;
        if (c < 9 || (c > 13 && c < 32) || c > 126) return 0;
    }
    return 1;
}

cJSON *cJSON_CreateFromCharArray(const char *buf, size_t size) {
    if (!buf || size == 0) return cJSON_CreateNull();
    if (cJSON_IsASCIIBuffer(buf, size)) {
        size_t str_len = 0;
        while (str_len < size && buf[str_len] != '\0') str_len++;
        char *str = (char *)cJSON_malloc(str_len + 1);
        if (str) {
            memcpy(str, buf, str_len);
            str[str_len] = '\0';
            cJSON *item = cJSON_CreateString(str);
            cJSON_free(str);
            return item;
        }
    }
    {
        char *b64 = cJSON_Base64Encode((const unsigned char *)buf, size);
        if (!b64) return cJSON_CreateNull();
        cJSON *obj = cJSON_CreateObject();
        cJSON_AddStringToObject(obj, "_type", "bytes");
        cJSON_AddStringToObject(obj, "base64", b64);
        cJSON_free(b64);
        return obj;
    }
}

cJSON *cJSON_CreateFromDbaseKeyword(int size, const char *keyword_ptr) {
    if (!keyword_ptr || size <= 0) return cJSON_CreateNull();

    if (cJSON_IsASCIIBuffer(keyword_ptr, (size_t)size)) {
        size_t str_len = 0;
        while (str_len < (size_t)size && keyword_ptr[str_len] != '\0') str_len++;
        if (str_len > 0) {
            char *str = (char *)cJSON_malloc(str_len + 1);
            if (str) {
                memcpy(str, keyword_ptr, str_len);
                str[str_len] = '\0';
                cJSON *item = cJSON_CreateString(str);
                cJSON_free(str);
                return item;
            }
        }
    }

    if (size == sizeof(int)) {
        int val;
        memcpy(&val, keyword_ptr, sizeof(int));
        return cJSON_CreateNumber((double)val);
    }

    {
        char *b64 = cJSON_Base64Encode((const unsigned char *)keyword_ptr, (size_t)size);
        if (!b64) return cJSON_CreateNull();
        cJSON *obj = cJSON_CreateObject();
        cJSON_AddStringToObject(obj, "_type", "bytes");
        cJSON_AddStringToObject(obj, "base64", b64);
        cJSON_free(b64);
        return obj;
    }
}


static unsigned char b64index[256] = { 0 };
static int b64init = 0;

static void init_b64index(void) {
    if (b64init) return;
    memset(b64index, 0x80, sizeof(b64index));
    {
        const char *b64table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        int i;
        for (i = 0; i < 64; i++) b64index[(unsigned char)b64table[i]] = (unsigned char)i;
    }
    b64init = 1;
}

unsigned char *cJSON_Base64Decode(const char *src, size_t *out_len) {
    size_t len, alloc_len, out_idx, i;
    unsigned char *out;
    uint32_t buf = 0;
    int bits = 0;

    if (!src) return NULL;
    len = strlen(src);
    if (len == 0) return NULL;

    init_b64index();

    alloc_len = (len * 3) / 4 + 4;
    out = (unsigned char *)cJSON_malloc(alloc_len);
    if (!out) return NULL;

    out_idx = 0;
    for (i = 0; i < len; i++) {
        unsigned char c = (unsigned char)src[i];
        if (c == '=') break;
        if (c > 127 || b64index[c] == 0x80) continue;

        buf = (buf << 6) | b64index[c];
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out[out_idx++] = (unsigned char)((buf >> bits) & 0xFF);
        }
    }

    if (out_len) *out_len = out_idx;
    return out;
}

int cJSON_ReadToCharArray(cJSON *item, char **out_buf, int *out_size) {
    if (!item || !out_buf || !out_size) return 0;

    if (cJSON_IsString(item) && item->valuestring != NULL) {
        size_t len = strlen(item->valuestring) + 1;
        char *buf = (char *)cJSON_malloc(len);
        if (!buf) return 0;
        memcpy(buf, item->valuestring, len);
        *out_buf = buf;
        *out_size = (int)len;
        return 1;
    }

    if (cJSON_IsNumber(item)) {
        int val = (int)item->valuedouble;
        char *buf = (char *)cJSON_malloc(sizeof(int));
        if (!buf) return 0;
        memcpy(buf, &val, sizeof(int));
        *out_buf = buf;
        *out_size = (int)sizeof(int);
        return 1;
    }

    if (cJSON_IsObject(item)) {
        cJSON *b64_item = cJSON_GetObjectItemCaseSensitive(item, "base64");
        if (cJSON_IsString(b64_item) && b64_item->valuestring != NULL) {
            size_t dec_len = 0;
            unsigned char *decoded = cJSON_Base64Decode(b64_item->valuestring, &dec_len);
            if (decoded) {
                *out_buf = (char *)decoded;
                *out_size = (int)dec_len;
                return 1;
            }
        }
    }

    if (cJSON_IsArray(item)) {
        int count = cJSON_GetArraySize(item);
        if (count <= 0) return 0;
        char *buf = (char *)cJSON_malloc((size_t)count);
        if (!buf) return 0;
        int i = 0;
        cJSON *arr_item;
        cJSON_ArrayForEach(arr_item, item) {
            if (cJSON_IsNumber(arr_item)) buf[i++] = (char)arr_item->valueint;
            else if (cJSON_IsString(arr_item) && arr_item->valuestring) buf[i++] = arr_item->valuestring[0];
            else buf[i++] = 0;
        }
        *out_buf = buf;
        *out_size = count;
        return 1;
    }

    return 0;
}
