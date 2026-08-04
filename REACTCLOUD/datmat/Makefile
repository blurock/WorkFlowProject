include ../etc/MakeDef.defs

###############################################################
# Program specific definitions
#   PROGNAME    - The name of the program and the directory
#   STD_LIBRARIES   - The available libraries to use
#   ALL_PROGS       - Those progs to be compiled
#   ALL_SOURCES     - The list of source files
#   ALL_OBJECTS     - The list of object files
###############################################################
PROGNAME   = datmat

HFILES = datmat0.h datmat1.h
ALL_PROGS = str_form library
ALL_SOURCES = \
     datmat0.c datmat1.c datmatbind.c \
     dtard0.c dtard1.c\
     samstr0.c samstr1.c syssambind.c\
     subset0.c subset1.c subset2.c subsetbind.c\
     varlst0.c varlst1.c varinfo.c varlstbind.c

ALL_OBJECTS = \
     datmat0.o datmat1.o datmatbind.o\
     dtard0.o dtard1.o\
     samstr0.o samstr1.o syssambind.o\
     subset0.o subset1.o subset2.o subsetbind.o\
     varlst0.o varlst1.o varinfo.o varlstbind.o

COMMANDFILES = datmat.lst datmat.als\
     ./datmat/subset.cmd ./datmat/syssam.cmd ./datmat/varlist.cmd

EXTRAS = main.c

include ../etc/MakeDef.prgs
