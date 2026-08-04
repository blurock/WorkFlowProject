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
PROGNAME   = gentrans
ALL_PROGS = str_form library
HFILES     = mol0.h molprops.h

ALL_SOURCES = \
        chain.c flatten.c perform.c setup.c update.c\
        combined.c formrxn.c readchain.c trnscorr.c\
        filter.c iteration.c rxn2trans.c trnsprint.c genfunc.c

ALL_OBJECTS = \
        chain.o flatten.o perform.o setup.o update.o\
        combined.o formrxn.o readchain.o trnscorr.o\
        filter.o iteration.o rxn2trans.o trnsprint.o genfunc.o

COMMANDFILES = util.cmd

EXTRAS = 


include ../etc/MakeDef.prgs
