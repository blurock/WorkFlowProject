include ../etc/MakeDef.defs

###############################################################
# Program specific definitions
#   PROGNAME    - The name of the program and the directory
#   STD_LIBRARIES   - The available libraries to use
#   ALL_PROGS       - Those progs to be compiled
#   ALL_SOURCES     - The list of source files
#   ALL_OBJECTS     - The list of object files
##############################################################
PROGNAME   = basis

STD_LIBRARIES     = 
HFILES            = basic.h dblink.h defines.h simple.h xdrrpc.h stopwatch.h
ALL_PROGS         = library
ALL_SOURCES = \
             alloc.c linint.c keywrd.c fileio.c error.c stopwatch.c dbaselink.c

ALL_OBJECTS = \
             alloc.o linint.o keywrd.o fileio.o error.o stopwatch.o dbaselink.o
#ALL_OBJECTS = \
#             alloc.debug.o linint.o keywrd.o fileio.o error.o stopwatch.o dbaselink.o

include ../etc/MakeDef.prgs

