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
PROGNAME   = spectrum
ALL_PROGS = str_form library
HFILES     = spec0.h

ALL_SOURCES = \
bind.c spec0.c    specmol.c  specprt.c

ALL_OBJECTS = \
bind.o spec0.o    specmol.o  specprt.o

COMMANDFILES = 

EXTRAS = 

STD_INCLUDES = -I$(CCROOT)/genc\
               -I$(CCROOT)/genh\
               -I$(CCROOT)/standard\
               $(EXTRAINCLUDES)

DEPLIBS = -L$(MYLIBDIR)\
           -lgentrans\
           -lnaming\
           -lrxn\
           -lmolprops\
           -lmolecules\
           -lgraphs\
           -lproperty\
           -ldbase\
           -ldatmat\
           -lcomlib\
           -lbasis\
           -lgdbm\
           -lm $(EXTRASYSTEMLIBS)


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
