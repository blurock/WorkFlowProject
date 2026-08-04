# REACT CloudRun - Chemistry System for Google Cloud Run

A containerized version of the REACT Chemistry System optimized for deployment on Google Cloud Run.

## What is REACT?

REACT is a sophisticated chemistry software system for:
- Molecular structure generation and analysis
- Chemical reaction pathway analysis
- Thermodynamic property calculations
- Database management for chemical compounds

## What is REACTCloudRun?

REACTCloudRun packages the REACT system in a Docker container designed for:
- **Cloud-Native Deployment**: Optimized for Google Cloud Run serverless platform
- **Dual-Mode Operation**: CLI for batch processing or HTTP API for web requests
- **Minimal Dependencies**: Only requires gdbm and standard C libraries
- **Multi-Stage Build**: Separate builder/runtime images for Cloud Run deployment

## Quick Links

- 📖 [Deployment Guide](docs/DEPLOY.md) - Deploy to Cloud Run
- 📋 [Implementation Plan](../../../session-state/96213969-ef5c-47f8-8b14-138695a0c189/files/implementation_plan.md) - Project roadmap
- 📚 [Original REACT Docs](README.md) - Original REACT documentation
- 🔧 [Installation Guide](INSTALL.txt) - Original REACT installation

## Project Structure

```
.
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Local development setup
├── .dockerignore           # Files excluded from Docker context
├── src/
│   ├── entrypoint.sh       # Container entry point (CLI/HTTP mode selector)
│   └── http-server.c       # HTTP API wrapper (Phase 4)
├── docs/
│   └── DEPLOY.md           # Cloud Run deployment guide
├── tests/
│   └── README.md           # Test cases and test data
├── bin/                    # Original REACT binaries (built in container)
├── data/                   # Chemistry data files
├── lib/                    # Compiled libraries (built in container)
└── [other REACT directories...]
```

## Getting Started

### 1. Local Development

```bash
# Build and run with Docker Compose
docker compose build
docker compose up

# The service will be available at http://localhost:8080
```

### 2. Deploy to Google Cloud Run

See [DEPLOY.md](docs/DEPLOY.md) for detailed Cloud Run deployment instructions.

### 3. Run CLI Commands

```bash
# Get help
docker run --rm reactcloudrun:latest --help

# Run the HTTP wrapper explicitly
docker run --rm -p 8080:8080 -e PORT=8080 reactcloudrun:latest http
```

## Architecture Overview

### Dual-Mode Entrypoint

The container can run in two modes:

#### 1. CLI Mode
- Process batch jobs
- Run from command line with arguments
- Suitable for Cloud Tasks, Cloud Scheduler

#### 2. HTTP Mode
- Expose chemistry operations via REST API
- Listen on port 8080
- JSON request/response format with `POST /api/run`
- Suitable for Cloud Run HTTP endpoints

### Container Layers (Multi-Stage Build)

**Build Stage**
- Ubuntu 22.04 base
- Build tools: gcc, make, build-essential
- Development libraries: gdbm-dev, libc6-dev
- Runs `make all` to compile the REACT binaries
- Runs `make install` to perform runtime setup and initialize the database files

**Runtime Stage**
- Ubuntu 22.04 base
- Runtime libraries: libc6, libgdbm6, libnsl2, libtirpc3, tcsh
- Copies compiled binaries from build stage
- Runs as a non-root `react` user

## External Dependencies

### System Libraries
- C Standard Library (libc) - included in base image
- POSIX System APIs - included in base image  
- RPC/XDR - included in glibc

### Third-Party Libraries
- **GNU DBM (gdbm)** - Database functionality
  - Runtime package: `libgdbm6`
  - Development package: `gdbm-dev` (only in build stage)

## Compilation & Build Status

### Original REACT
- Last compiled: ~12 years ago
- Compiler: GNU cc (gcc)
- Status: Requires modernization for current gcc

### REACTCloudRun Build Process
- **Phase 2**: Multi-stage Dockerfile setup
- **Phase 3**: C code updates for modern compiler compatibility
- **Phase 4**: HTTP server and mode-switching entrypoint
- **Phase 5**: Local testing
- **Phase 6**: Production optimization

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | HTTP server port |
| `REACTROOT` | /opt/react | REACT installation directory |
| `CCROOT` | /opt/react | REACT installation directory |
| `REACT_MODE` | unset | Optional explicit mode override (`cli` or `http`) |

### Dockerfile Build Args

None currently.

## Performance Considerations

- **Memory**: Recommend 2 GB minimum for Cloud Run
- **Timeout**: 3600 seconds recommended (1 hour)
- **Concurrency**: Depends on workload, typically 1-10 instances

## Troubleshooting

### Issue: Build fails with compiler errors
**Solution**: Use the updated branch with the Phase 3 compiler fixes before building the image

### Issue: Container won't start
**Solution**: Verify entrypoint.sh is executable and check logs

### Issue: Database files missing
**Solution**: Rebuild the image from this branch; the Docker build explicitly runs `make all` followed by `make install`

### Issue: HTTP port not responding
**Solution**: Ensure `PORT` is set and use `POST /api/run` with a JSON `args` array

See [DEPLOY.md](docs/DEPLOY.md) for more troubleshooting.

## Development Phases

✅ **Phase 1**: Project Setup - Docker structure, .gitignore, initial files
✅ **Phase 2**: Dockerfile Creation - Multi-stage build
✅ **Phase 3**: C Code Updates - Fix compiler issues  
✅ **Phase 4**: Entry Point - HTTP server wrapper
✅ **Phase 5**: Local Testing - Docker and endpoint validation
✅ **Phase 6**: Optimization - Cloud Run runtime hardening and deploy flow

## Contributing

When working on REACTCloudRun:
1. Keep changes isolated to docker-related files
2. Don't modify core REACT source files unnecessarily
3. Update documentation as you go
4. Test locally with docker-compose before committing
5. Follow the phase-based approach in implementation_plan.md

## Branch

This work is on the `react-cloudrun` branch. Original REACT remains on `master`.

## License

Inherits from original REACT project. See LICENSE file.

## Next Steps

To continue development:

1. Deploy to Cloud Run using `docs/DEPLOY.md` (Artifact Registry + `gcloud run deploy`)
2. Tune memory, timeout, and max instances based on production usage

See [Implementation Plan](../../../session-state/96213969-ef5c-47f8-8b14-138695a0c189/files/implementation_plan.md) for details.
