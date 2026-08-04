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
PROGNAME   = rxn
ALL_PROGS = str_form library
HFILES     = mol0.h molprops.h

ALL_SOURCES = \
       rmolfile.c asciiread.c rxnprps.c rxn0.c rxn1.c rxnfunc.c rxnprt.c rxntype.c

ALL_OBJECTS = \
        rmolfile.o asciiread.o rxnprps.o rxn0.o rxn1.o rxnfunc.o rxnprt.o rxntype.o

COMMANDFILES = util.cmd

EXTRAS = 


include ../etc/MakeDef.prgs
