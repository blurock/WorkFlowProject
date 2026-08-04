# REACTCloudRun Implementation Plan

## Project Overview
- **Source**: Clone from existing REACT repository (keep original intact)
- **Target**: Docker container optimized for Google Cloud Run
- **Purpose**: Batch/job processing service
- **Architecture**: Dual-mode entry point (CLI + HTTP endpoint on port 8080)
- **Base Image**: Ubuntu 22.04 LTS
- **Build Strategy**: Multi-stage Docker build (minimize final image size)

---

## Phase 1: Project Setup
**Goal**: Create REACTCloudRun project and establish structure

### Tasks:
1. Create new project via `create_project` (clone REACT repo)
2. Create branch for CloudRun work
3. Add .gitignore for Docker artifacts
4. Create project structure:
   ```
   REACTCloudRun/
   ├── Dockerfile
   ├── docker-compose.yml (for local testing)
   ├── src/
   │   ├── entrypoint.sh (batch mode)
   │   ├── http-server.c (simple HTTP wrapper)
   │   └── config/
   ├── docs/
   │   └── DEPLOY.md
   └── tests/
   ```

---

## Phase 2: Dockerfile Creation (Multi-Stage Build)

### Stage 1: Builder
- **Base**: ubuntu:22.04
- **Install dependencies**:
  - build-essential (gcc, g++, make)
  - libc6-dev
  - gdbm-dev
  - libgdbm-dev
  - curl (for testing)
  - git (may be needed)
- **Copy source code**
- **Compile REACT** (`make install`)
- **Note**: Keep build tools in this layer only

### Stage 2: Runtime
- **Base**: ubuntu:22.04 (or ubuntu:22.04-slim for smaller footprint)
- **Install only runtime dependencies**:
  - libc6 (runtime)
  - libgdbm6 (runtime)
  - Any other runtime libs needed
- **Copy binaries from builder**: `/opt/react/bin/chemdb`, runtime libs
- **Copy runtime config/data files**
- **Set PORT 8080 and entry point**

### Expected Issues to Handle:
1. **RPC/XDR headers**: May need `-D_GNU_SOURCE` flag
2. **Missing includes**: Modern gcc stricter about implicit function declarations
3. **Deprecated functions**: strcpy → strncpy, etc.
4. **Socket APIs**: May need modern header includes
5. **Compiler warnings as errors**: May need to add `-Wno-error=...` flags

---

## Phase 3: C Code Assessment & Updates

### Common Issues in 12-Year-Old C Code:
- [ ] Check for implicit function declarations
- [ ] Verify all #include statements are present
- [ ] Look for deprecated gdbm API usage
- [ ] Check for buffer overflow risks (strcpy, gets, sprintf)
- [ ] Verify socket/network code compatibility (if any)
- [ ] Check for missing function prototypes

### Compilation Strategy:
1. Attempt initial build in Docker
2. Capture compiler errors/warnings
3. Fix most critical issues first (compilation blockers)
4. Fix deprecation warnings
5. Address runtime issues if they appear

---

## Phase 4: Dual-Mode Entry Point

### Mode 1: CLI/Batch (Primary)
- Keep existing REACT CLI behavior
- Use `ENTRYPOINT` to call `/opt/react/bin/chemdb` with args
- Example: `docker run reactcloudrun:latest chemdb --help`

### Mode 2: HTTP Endpoint (Secondary)
- Create simple C program or Python wrapper that:
  - Listens on port 8080
  - Receives HTTP POST requests
  - Parses job parameters from JSON
  - Spawns `chemdb` subprocess
  - Returns results as JSON
- **Simple approach**: Use curl-based wrapper or netcat
- **Advanced approach**: Implement minimal HTTP server in C

### Entry Point Decision:
- If `$PORT` env var set → start HTTP server
- Otherwise → act as CLI tool
- Allow override via command-line arg

---

## Phase 5: Local Testing

### Docker Compose Setup:
```yaml
version: '3'
services:
  react:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
    volumes:
      - ./data:/opt/react/data
```

### Test Cases:
1. [ ] Container builds successfully
2. [ ] Container runs and listens on 8080
3. [ ] `curl -X POST http://localhost:8080/api/run` works
4. [ ] CLI mode works: `docker run ... chemdb --help`
5. [ ] Database initialization completes
6. [ ] Sample chemistry calculation runs

---

## Phase 6: Production Optimization

### Dockerfile Optimizations:
- Use `.dockerignore` to exclude unnecessary files
- Cache layer ordering (most stable → most changeable)
- Remove build artifacts and temp files
- Keep image under 500MB (goal)

### Cloud Run Specific:
- Set `PORT` environment variable handling
- Ensure graceful shutdown (trap SIGTERM)
- Set resource limits appropriately
- Document environment variables needed

---

## Key Questions Answered:
✅ Project type: Batch/job processing service
✅ Deployment model: Self-contained Docker
✅ Entry points: CLI + HTTP on port 8080
✅ Base image: Ubuntu 22.04 LTS
✅ C code approach: Proactive checking
✅ Image optimization: Multi-stage build (yes)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Compilation failures (12-yr-old code) | High | High | Incremental builds, fix as we go |
| RPC/XDR incompatibility | Medium | High | Update headers, check glibc docs |
| Library version mismatches | Medium | Medium | Use specific package versions |
| Performance degradation | Low | Medium | Profile in Docker before deploy |
| Database initialization failure | Medium | Medium | Script it, test locally first |

---

## Timeline Estimate
- Phase 1: 15 min
- Phase 2: 30 min (initial Dockerfile)
- Phase 3: 1-2 hours (C code fixes)
- Phase 4: 30 min (entry point wrapper)
- Phase 5: 30 min (local testing)
- Phase 6: 30 min (optimization)

**Total: 3-4 hours for MVP**

