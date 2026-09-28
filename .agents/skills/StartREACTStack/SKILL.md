---
name: StartREACTStack
description: Instructions for starting, stopping, rebuilding, and checking the status of the REACTInterface and REACTCLOUD local development stack using the start_react_stack.sh master startup script.
---

# Managing the Local REACT Stack with `start_react_stack.sh`

## Overview

The [`start_react_stack.sh`](file:///Users/edwardblurock/git/WorkFlowProject/start_react_stack.sh) script is the primary master control script for managing the local REACT development environment. It automates:
1. **C Backend Compilation**: Compiles C libraries (`comlib`, `molecules`, `rxn`, `chemdb`) and the `chemdb` binary in `REACTCLOUD/`.
2. **Node.js Orchestrator Service**: Runs `orchestrator/server.js` on port `8085`.
3. **REACTInterface Angular Frontend**: Runs the Angular development server on port `4200`.

---

## Command Usage

All commands are executed from the repository root:

```bash
./start_react_stack.sh [OPTION]
```

### Options Reference

| Flag / Option | Command | Description |
| :--- | :--- | :--- |
| *(None)* | `./start_react_stack.sh` | Checks for missing services and starts any stopped components (Orchestrator, Frontend). |
| `--status` | `./start_react_stack.sh --status` | Displays the current running status, PIDs, and URLs for Orchestrator (Port 8085) and Frontend (Port 4200). |
| `--stop` | `./start_react_stack.sh --stop` | Stops both the Orchestrator and Angular Frontend background processes cleanly. |
| `--build` | `./start_react_stack.sh --build` | Forces a rebuild of the C backend libraries and `chemdb` binary before starting services. |
| `--help` | `./start_react_stack.sh --help` | Displays script usage information and options. |

---

## Typical Workflows

### 1. Launching or Resuming Stack
To launch all services or bring up any stopped service:
```bash
./start_react_stack.sh
```

### 2. Restarting Services After Code Changes
When updates are made to `REACTCLOUD/orchestrator/server.js` or C source code:
1. Stop running processes:
   ```bash
   ./start_react_stack.sh --stop
   ```
2. Re-launch stack (use `--build` if C code was modified):
   ```bash
   ./start_react_stack.sh --build
   ```

### 3. Checking Stack Health & PIDs
To inspect whether services are online and active:
```bash
./start_react_stack.sh --status
```

---

## Service URLs & Log Files

| Service | Local URL | Log Location |
| :--- | :--- | :--- |
| **Node.js Orchestrator** | `http://localhost:8085` | `/tmp/react_orchestrator.log` |
| **Angular Frontend** | `http://localhost:4200` | `/tmp/react_frontend.log` |

To inspect log outputs:
```bash
tail -n 50 /tmp/react_orchestrator.log
tail -n 50 /tmp/react_frontend.log
```
