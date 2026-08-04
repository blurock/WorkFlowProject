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
PROGNAME   = structgen
ALL_PROGS = str_form library
HFILES     = structgen.h

ALL_SOURCES = \
       structgen.c\
       generate.c\
       generate1.c

ALL_OBJECTS = \
       structgen.o\
       generate.o\
       generate1.o

COMMANDFILES = structgen.cmd

include ../etc/MakeDef.prgs

STD_LIBRARIES =\
           -lchemdb\
           -lstructgen\
           -lgentrans\
           -lnaming\
           -lrxn\
           -lspectrum\
           -lmolprops\
           -lmolecules\
           -lgraphs\
           -lproperty\
           -lstatistics\
           -ldbase\
           -ldatmat\
           -lcomlib\
           -lbasis\
           -lgdbm\
           -lm $(EXTRASYSTEMLIBS)
