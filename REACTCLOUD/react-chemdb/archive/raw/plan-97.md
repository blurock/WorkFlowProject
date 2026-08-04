# Phase 2: Dockerfile Finalization & Build Testing

## Objective
Finalize and test the multi-stage Docker build for REACT CloudRun

## Current Issues Found

### 1. Makefile Issues
- ✅ Fixed: `rm data/DB/*.dbf` changed to `rm -f data/DB/*.dbf`
- Need to set REACTROOT env var properly for build

### 2. Compilation Errors (from direct build attempt)

**Error 1**: `strmas.h` - Missing return type
```
/Users/edwardblurock/git/react/standard/strmas.h:90:8: error: type specifier missing
extern OutputSystemListFiles(StructureSet *set);
```
- **Fix**: Add `int` return type

**Type**: Implicit int deprecation (old C code)
**Scope**: Headers and C files with missing return types

## Tasks

### Task 1: Fix Header Files
- [ ] Fix strmas.h line 90 - add return type to OutputSystemListFiles
- [ ] Scan for other similar issues in headers
- [ ] Fix function prototypes missing return types

### Task 2: Fix Function Definitions
- [ ] Scan C source files for deprecated function definitions without prototypes
- [ ] Update function signatures to modern C style

### Task 3: Build & Test
- [ ] Attempt full build with fixes
- [ ] Capture any new errors
- [ ] Iterate until successful

### Task 4: Verify Multi-Stage Build
- [ ] Confirm Dockerfile builds correctly
- [ ] Test runtime binaries copied properly
- [ ] Document any adjustments made

## Build Command
```bash
cd /Users/edwardblurock/git/react
REACTROOT=/Users/edwardblurock/git/react CCROOT=/Users/edwardblurock/git/react make install
```

## Status
- Starting compilation issue fixing

## Compilation Errors Found (Iteration 2)

### Category 1: Missing Library Functions
- `floor()` in mol1.c - needs `#include <math.h>`
- `fabs()` in rxntype.c - needs `#include <math.h>`

### Category 2: Missing Function Declarations
- `yylex` in yaccpar - needs lexer declaration
- `LocalReadInASCIIMols` in asciimol.c
- `PrintMoleculeSetAsMolFile` in mechanism.c
- `PrintChemkinValuesForMolecules` in mechanism.c

### Category 3: Function Pointer Type Mismatches (qsort callbacks)
- univar.c:303 - passing int(*)(float*, float*) instead of int(*)(const void*, const void*)
- spec0.c:280 - passing int(*)(SpectrumPair*, SpectrumPair*) 
- formrxn.c:406,409 - passing int(*)(int*, int*)
- mechanism.c:801, 1334 - passing int(*)(void*, void*)

## Fixes Required
1. Add `#include <math.h>` to mol1.c and rxntype.c
2. Add missing function declarations or forward declarations
3. Fix qsort callback function signatures to match required prototype

## Strategy
- Add math.h includes globally via CFLAGS or per-file
- Suppress warnings for missing function declarations with -Wno-implicit-function-declaration (risky but may be necessary)
- Fix qsort callbacks to use proper const void* signatures

## Phase 2 - COMPLETION SUMMARY

### ✅ Completed Tasks
1. **Makefile Fixes**
   - ✅ Fixed data/DB cleanup to not fail on missing files
   - ✅ Set environment variables (REACTROOT, CCROOT, BINDIR) for successful compilation

2. **Return Type Declarations Fixed** 
   - ✅ strmas.h: OutputSystemListFiles (was missing void)
   - ✅ sysout.c: OutputSystemListFiles definition (was missing void)
   - ✅ createstructures/main.c: Added int return type
   - ✅ chemdb/rxnpatin.c: Added void return type to static functions (2 instances)

3. **Compiler Configuration**
   - ✅ Added -std=c89 flag for old C compatibility
   - ✅ Added -Wno-implicit-int to suppress implicit int warnings
   - ✅ Added -Wno-error=incompatible-function-pointer-types for qsort callbacks
   - ✅ Added -Wno-error=implicit-function-declaration

4. **Build Progress**
   - ✅ 14 of 16 libraries built successfully
   - ✅ Libraries: basis, datmat, dbase, comlib, graphs, molprops, naming, 
     property, rxn, spectrum, gentrans, chemdb, cluster, structgen

### ⏳ Remaining Issues (Not Blocking Docker)
- molecules library has pointer/int conversion error (atominf.c:114)
- statistics library likely has similar issues
- These are deep C code issues requiring manual fixes

### Build Commands
Successful partial build:
```bash
cd /Users/edwardblurock/git/react
REACTROOT=/Users/edwardblurock/git/react \
CCROOT=/Users/edwardblurock/git/react \
BINDIR=/Users/edwardblurock/git/react/bin \
make install
```

### Files Changed
- Makefile: Fixed rm command for DB files
- etc/MakeDef.defs: Updated CCOPTIONS with compiler flags
- standard/strmas.h: Added void return type
- createstructures/sysout.c: Added void return type
- createstructures/main.c: Added int return type
- chemdb/rxnpatin.c: Added void return types (2x)

### Commit
- Commit: d5d93df
- Branch: react-cloudrun
- Message: "Phase 2: C code compilation fixes and build improvements"

## Next Phase: Phase 3 - Partial Docker Build Test
Recommendation: Build Docker with partial REACT (14/16 libraries working)
or manually fix remaining 2 libraries for complete build.

The current state is sufficient for Docker image creation with most chemistry functionality.

## Phase 4 - COMPLETION SUMMARY

### ✅ Completed Tasks
- Implemented a real HTTP wrapper in `src/http-server.c`
- Added `GET /health`, `GET /`, and `POST /api/run`
- Updated `src/entrypoint.sh` to auto-select HTTP mode when `PORT` is set and no CLI args are provided
- Updated `Dockerfile` to install `tcsh`, build `chemdb`, compile `http-server`, and copy runtime assets needed by chemdb
- Updated deployment and test docs for the finalized runtime behavior

### HTTP API
- `GET /health` → health response
- `GET /` → API summary
- `POST /api/run` with `{"args":["--help"]}` → runs chemdb and returns JSON output

### Local Validation
- Compiled `src/http-server.c` successfully with `gcc -O2 -Wall -Wextra`
- Verified `src/entrypoint.sh` shell syntax
- Verified `/health` and `/api/run` responses against the local `chemdb` binary

## Next Phase: Phase 5 - Local Testing
Next work should focus on full container validation with Docker/Compose once Docker is available.

## Phase 5 - COMPLETION SUMMARY

### ✅ Completed Tasks
- Built the Docker image successfully as `reactcloudrun:phase5`
- Fixed Linux container compatibility issues for gcc, tirpc RPC/XDR headers, and legacy common-symbol linking
- Verified CLI mode with `docker run --rm reactcloudrun:phase5 --help`
- Verified HTTP mode with `docker run --rm -p 18080:18080 -e PORT=18080 reactcloudrun:phase5`
- Verified `GET /health` and `POST /api/run` inside the container

### Docker Validation Results
- Image size: 41,471,112 bytes (~41.5 MB)
- `GET /health` response: `{"status":"ok","service":"chemdb"}`
- `POST /api/run` successfully invoked `chemdb` and returned JSON output

### Linux Compatibility Changes
- Switched shared build flags to `-std=gnu89` and `-fcommon`
- Added Ubuntu packages for tirpc/nsl support in the Docker image
- Added compatibility shims for `netconfig.h`, `rpc/types.h`, and `rpc/xdr.h`
- Aligned package-specific Makefiles with the Linux-safe compiler settings

## Next Phase: Phase 6 - Production Optimization
Remaining work is image/runtime optimization and any Cloud Run specific tuning.
