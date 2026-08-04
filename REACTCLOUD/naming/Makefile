include ../etc/MakeDef.defs

###############################################################
# Program specific definitions
#   PROGNAME    - The name of the program and the directory
#   STD_LIBRARIES   - The available libraries to use
#   ALL_PROGS       - Those progs to be compiled
#   ALL_SOURCES     - The list of source files
#   ALL_OBJECTS     - The list of object files
#   EXTRAS          - The list of extra files associated with program
###############################################################
PROGNAME   = naming
ALL_PROGS = str_form library
HFILES     = 

ALL_SOURCES = paths.c check.c nameit.c sidegroups.c longname.c

ALL_OBJECTS = paths.o check.o nameit.o sidegroups.o longname.o

COMMANDFILES = util.cmd

EXTRAS = 
STD_LIBRARIES =\
           -lmolprops\
           -lmolecules\
           -lgraphs\
           -lproperty\
           -lstatistics\
           -ldbase\
           -ldatmat\
           -lcomlib\
           -lbasis\
           -lgdbm

include ../etc/MakeDef.prgs
