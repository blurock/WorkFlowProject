---
name: Compile REACT Backend
description: Instructions for compiling the REACT C backend libraries and chemdb executable when backend C code changes are made, and setting up the endpoint of the REACTCLOUD backend.
---

# Compile REACT Backend

## Overview

When modifications are made to the REACT / REACTCLOUD C backend codebase, only the `library` and `chemdb` targets need to be recompiled. Other Makefile targets (such as `clean`, `all`, `runsetup`, `database`) are not required for incremental code changes and should not be run.

---

## 1. Required Environment Variables

Before running `make` or starting the backend endpoint, the following environment variables must be exported in the shell environment. Both point to the root directory of the REACT system (`REACTCLOUD`):

```bash
export REACTROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
export CCROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
```

If working inside the `REACTCLOUD` directory:
```bash
export REACTROOT=$PWD
export CCROOT=$PWD
```

---

## 2. Compilation Workflow for Backend Changes

When C source files or headers in any module directory (`comlib`, `molecules`, `rxn`, `chemdb`, etc.) are changed:

1. Navigate to the `REACTCLOUD` directory:
   ```bash
   cd /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
   ```

2. Set the environment variables and run the build:
   ```bash
   export REACTROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
   export CCROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
   make library chemdb
   ```

---

## 3. Makefile Targets Explanation

- **`library`**: Recompiles modified source files across all subdirectories (`basis`, `comlib`, `datmat`, `dbase`, `graphs`, `molecules`, `molprops`, `naming`, `property`, `rxn`, `spectrum`, `gentrans`, `chemdb`, `statistics`, `cluster`, `structgen`) and updates their respective static library archives in `lib/`.
- **`chemdb`**: Links all object files and static libraries into the main `chemdb` binary and copies the output to `bin/chemdb`.

> **Note**: Avoid running `make clean` or `make all` during normal code updates, as that removes generated directories and header files.

---

## 4. Setting Up the Endpoint of the REACTCLOUD Backend

When deploying or testing locally, the HTTP wrapper endpoint needs to be compiled and executed using `src/http-server.c` and `src/entrypoint.sh`.

### Step 4.1: Compile the HTTP Server
If changes are made to `src/http-server.c` or after recompiling the backend:
```bash
gcc -O2 -Wall -Wextra -o /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/bin/http-server /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/src/http-server.c
```

### Step 4.2: Launch the Local Endpoint
Set the environment variables (including `PORT`, e.g., `8080` or `8081`) and run `entrypoint.sh` in `http` mode:
```bash
export REACTROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
export CCROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
export PORT=8081
/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/src/entrypoint.sh http
```

### Step 4.3: Verify the Endpoint
- **Health Check (`GET /health`)**:
  ```bash
  curl -i http://localhost:8081/health
  ```
  Expected Response: `HTTP/1.1 200 OK` with `{"status":"ok","service":"chemdb"}`

- **Execute `chemdb` via API (`POST /api/run`)**:
  ```bash
  curl -i -X POST http://localhost:8081/api/run \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer test-token' \
    -d '{"args":["--help"]}'
  ```
  Expected Response: `HTTP/1.1 200 OK` containing JSON output with `"exitCode"` and `"output"`.
