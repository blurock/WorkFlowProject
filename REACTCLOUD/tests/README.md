# REACT CloudRun Testing

This directory contains test cases and test data for the CloudRun deployment.

## Test Categories

### 1. Build Tests
- [ ] Docker build completes without errors
- [ ] Multi-stage build produces runtime image
- [ ] Final image size is reasonable (<500MB)

### 2. Runtime Tests
- [ ] Container starts successfully
- [ ] chemdb binary is accessible
- [ ] Database initialization works
- [ ] REACT environment variables are set correctly

### 3. API Tests (HTTP Mode)
- [ ] Server listens on port 8080
- [ ] Health check endpoint responds
- [ ] POST request handling works
- [ ] JSON parsing works correctly
- [ ] Results are returned as JSON

### 4. Chemistry Calculation Tests
- [ ] Sample molecule calculation completes
- [ ] Output is in expected format
- [ ] Database queries work

## Running Tests

```bash
# Build test
docker build -t react-test:latest .

# Runtime test
docker run --rm react-test:latest --help

# HTTP server test
docker run --rm -p 8080:8080 -e PORT=8080 react-test:latest

# In another terminal:
curl http://localhost:8080/health
curl -X POST http://localhost:8080/api/run \
  -H 'Content-Type: application/json' \
  -d '{"args":["--help"]}'
```

## Test Data

Place sample input files here:
- molecules.txt
- reactions.cfg
- sample-calculation.inp

See REACT documentation for file format specifications.
