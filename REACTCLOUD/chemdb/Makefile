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
PROGNAME   = chemdb
ALL_PROGS = str_form library
HFILES     = mol0.h molprops.h

ALL_SOURCES = \
       objfindmol.c objfind.c genrxn.c asciiprp.c rxndb.c dbrxnsearch.c bensontables.c\
       mechanism.c moldb.c datab.c  dbmolsearch.c dbfunc.c rxnpatin.c combine.c

ALL_OBJECTS = \
       objfindmol.o objfind.o genrxn.o asciiprp.o rxndb.o dbrxnsearch.o bensontables.o\
       mechanism.o moldb.o datab.o dbmolsearch.o dbfunc.o rxnpatin.o combine.o

COMMANDFILES = util.cmd

EXTRAS = 

STD_INCLUDES = -I$(CCROOT)/genc\
               -I$(CCROOT)/genh\
               -I$(CCROOT)/standard\
               $(EXTRAINCLUDES)

DEPLIBS = -L$(MYLIBDIR)\
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


CFLAGS = -g $(CCOPTIONS) $(STD_INCLUDES)

all: $(ALL_PROGS)

redo: rmchemdb $(PROGNAME)

$(PROGNAME): $(ALL_OBJECTS) main.o
	$(CC) -o $(PROGNAME) $(CCFLAGS) $(ALL_OBJECTS) main.o $(DEPLIBS)
	cp $(PROGNAME) $(CCROOT)/bin/$(PROGNAME)

str_form:
	cd $(CCROOT); $(CREATESTRUCT) $(PROGNAME) Str
clean:
	$(CCROOT)/bin/cleandir

rmchemdb:
	rm chemdb

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
