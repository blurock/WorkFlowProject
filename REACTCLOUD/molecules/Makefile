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
PROGNAME   = molecules
ALL_PROGS = str_form library
HFILES     = mol0.h molprops.h

ALL_SOURCES = \
       mollist.c mol1.c molgrph.c molgrph1.c molgrph2.c molgrph3.c \
       mol0.c atmprps.c atominf.c valence.c\
       bond.c charge.c mat.c electron.c

ALL_OBJECTS = \
       mollist.o mol1.o molgrph.o molgrph1.o molgrph2.o molgrph3.o \
       mol0.o atmprps.o atominf.o valence.o\
       bond.o charge.o mat.o electron.o


COMMANDFILES = util.cmd

include ../etc/MakeDef.prgs
