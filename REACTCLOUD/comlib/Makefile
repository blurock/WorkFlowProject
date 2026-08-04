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
PROGNAME   = comlib
ALL_PROGS = str_form library
HFILES     = comlib.h command.h
ALL_SOURCES = \
               setup1.c setup0.c errstat.c alias.c comd.c comdstd.c\
               argument.c execute.c level.c levellib.c print.c\
               sprint.c lex.c files.c aux.c bind0.c batch.c age.c


ALL_OBJECTS = \
               setup1.o setup0.o errstat.o alias.o comd.o\
               argument.o execute.o level.o levellib.o print.o\
               sprint.o lex.o files.o aux.o bind0.o batch.o age.o

COMMANDFILES = util.cmd

EXTRAS = command.y command.l

#command.c: command.y
#	yacc -v -d command.y
#	mv y.tab.c command.c
#	mv y.tab.h ../standard/command.h

#lex.yy.c: command.l command.y
#	lex  command.l

include ../etc/MakeDef.prgs
