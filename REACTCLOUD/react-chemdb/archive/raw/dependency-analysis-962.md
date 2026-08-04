# REACT Repository - External Library Dependencies Analysis

## Summary
Based on examination of include files in the `standard/` directory, the following external libraries are required:

### External System Libraries (Standard C/Unix)

1. **limits.h** - C Standard Library
   - Defines implementation limits for integral types
   - Used for platform-specific integer constraints

2. **rpc/types.h** - Sun RPC (Remote Procedure Call)
   - Part of the RPC library suite
   - Defines standard RPC data types
   - Typically provided by glibc or libc-dev packages

3. **rpc/xdr.h** - XDR (External Data Representation)
   - Part of the RPC library suite
   - Provides serialization/deserialization functions for RPC
   - Critical for network communication
   - Library: usually `-lrpc` or included in glibc

4. **stdio.h** - C Standard Library
   - Standard I/O operations
   - Part of libc

5. **stdlib.h** - C Standard Library
   - Standard utility functions (malloc, free, etc.)
   - Part of libc

6. **string.h** - C Standard Library
   - String manipulation functions
   - Part of libc

7. **sys/types.h** - POSIX System Types
   - Defines standard system data types
   - Part of POSIX/Unix standard

### Third-Party Libraries (Based on Header References)

8. **gdbm.h** - GNU DBM Database Library
   - Used for database operations
   - Header: `gdbm.h` 
   - Likely used for key-value storage
   - Package: `gdbm-devel` or `libgdbm-dev`

### Internal Project Modules (Not External Libraries)

The following are internal REACT project modules (not external dependencies):
- chemdb/
- cluster/
- comlib/
- command/
- datmat/
- dbase/
- gentrans/
- graphs/
- molecules/
- molprops/
- property/
- rxn/
- spectrum/
- stats/
- structgen/

## Build Requirements Summary

### Required System Packages:
- **C Standard Library** (libc): Usually pre-installed
- **POSIX Development Headers**: Usually included with build tools
- **glibc-devel** or **libc-dev**: For RPC/XDR support
- **gdbm-devel** or **libgdbm-dev**: For database functionality

### Example Installation Commands:

**Ubuntu/Debian:**
```bash
sudo apt-get install libc6-dev gdbm-dev
```

**CentOS/RHEL:**
```bash
sudo yum install glibc-devel gdbm-devel
```

**macOS (via Homebrew):**
```bash
brew install gdbm
```

## Build Compiler Flags

To link against these libraries during compilation:
```bash
gcc -o program program.c -lgdbm
# For RPC/XDR, usually automatically linked
```

## Conclusion

The REACT project has **minimal external dependencies**:
- **Only 1 third-party library**: GNU DBM (gdbm)
- **All other externals**: Standard C/POSIX libraries (usually pre-installed on development systems)

This is a relatively lightweight dependency footprint, primarily dependent on standard system libraries and one database library.
