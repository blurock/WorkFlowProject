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
PROGNAME   = molprops
ALL_PROGS = str_form library
HFILES     = mol0.h molprops.h

ALL_SOURCES = \
       benson2chemkin.c molcalc.c molread.c scndcorr.c molprp.c molprt.c\
       bensonord.c ben2ndorder.c asciimol.c\
       chemkinread.c chemkinutil.c tableset.c prpfunc.c

ALL_OBJECTS = \
        benson2chemkin.o molcalc.o molread.o scndcorr.o molprp.o molprt.o\
        bensonord.o ben2ndorder.o asciimol.o\
        chemkinread.o chemkinutil.o tableset.o prpfunc.o

COMMANDFILES = util.cmd

EXTRAS = 


include ../etc/MakeDef.prgs
