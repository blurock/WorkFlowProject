######################################################
# This is a file of definitions for the Makefile     #
######################################################

######################################################
# Directory Definitions                              #
######################################################

BACKUPDIR  = $(CCROOT)/backup
MYLIBDIR   = $(CCROOT)/lib
BINDIR     = $(CCROOT)/bin
MAINDIR    = ./$(PROGNAME)

######################################################
# Library Definitions                                #
######################################################

LIBNAME    = lib$(PROGNAME).a
LIBFILE    = $(MYLIBDIR)/$(LIBNAME)
######################################################
# Compiler Type Definitions                          #
######################################################
CREATESTRUCT    = $(CCROOT)/bin/createstructures
CC              = gcc
CCOPTIONS       = -g -std=gnu89 -fcommon -Wno-implicit-int -Wno-error=incompatible-pointer-types -Wno-error=implicit-function-declaration -DCOMDIR='"$(CCROOT)/command"'
RANLIB          = ranlib
###############################################################
# Program specific definitions
#   PROGNAME    - The name of the program and the directory
#   STD_LIBRARIES   - The available libraries to use
#   ALL_PROGS       - Those progs to be compiled
#   ALL_SOURCES     - The list of source files
#   ALL_OBJECTS     - The list of object files
##############################################################
PROGNAME   = statistics

HFILES = statistics.h matrix0.h
ALL_PROGS = str_form library
ALL_SOURCES = \
              univar.c divisions.c\
              routines.c statmain.c statout.c\
              simple.c matrix0.c statbind.c

ALL_OBJECTS = \
              univar.o divisions.o\
              routines.o statmain.o statout.o\
              simple.o matrix0.o statbind.o

COMMANDFILES = statistics.lst statistics.als\
        statistics/statistics.cmd
EXTRAS = main.c
STD_INCLUDES = -I$(CCROOT)/genc\
               -I$(CCROOT)/genh\
               -I$(CCROOT)/standard\
               $(EXTRAINCLUDES)

DEPLIBS = -L$(MYLIBDIR)\
           -lcluster\
           -ldatmat\
           -lcomlib\
           -lbasis\
            -lm
CFLAGS = $(CCOPTIONS) $(STD_INCLUDES)

all: $(ALL_PROGS)

$(PROGNAME): $(ALL_OBJECTS) main.o
	$(CC) -o $(PROGNAME) $(CCFLAGS) $(ALL_OBJECTS) main.o $(DEPLIBS)
	cp $(PROGNAME) $(CCROOT)/bin/$(PROGNAME)

str_form:
	cd $(CCROOT); $(CREATESTRUCT) $(PROGNAME) Str
clean:
	$(CCROOT)/bin/cleandir

library: $(ALL_OBJECTS)
	$(AR) rv $(LIBFILE) $(ALL_OBJECTS)
	$(RANLIB) $(LIBFILE)

backup2: backup1 commandfiles

backup1: backup0 structfiles

backup0: clean tarfile mkfile hfiles

tarfile:
	cd $(CCROOT)/$(PROGNAME);tar -cf $(BACKUPDIR)/$(PROGNAME).tar $(ALL_SOURCES) $(EXTRAS)
	compress $(BACKUPDIR)/$(PROGNAME).tar

hfiles:
	cd $(CCROOT)/standard; tar -cf $(BACKUPDIR)/hfiles.$(PROGNAME).tar $(HFILES)
	compress $(BACKUPDIR)/hfiles.$(PROGNAME).tar

structfiles:
	cd $(CCROOT)/struct; tar -cf $(BACKUPDIR)/struct.$(PROGNAME).tar ./$(PROGNAME)/*.def $(PROGNAME).lst
	compress $(BACKUPDIR)/struct.$(PROGNAME).tar

commandfiles:
	cd $(CCROOT)/command; tar -cf $(BACKUPDIR)/command.$(PROGNAME).tar $(COMMANDFILES)
	compress $(BACKUPDIR)/command.$(PROGNAME).tar

mkfile:
	cp $(CCROOT)/$(PROGNAME)/make.defs $(BACKUPDIR)/make.defs.$(PROGNAME)

depend:
	makedepend  -- $(CFLAGS) -- $(ALL_SOURCES)



# DO NOT DELETE THIS LINE -- make depend depends on it.
