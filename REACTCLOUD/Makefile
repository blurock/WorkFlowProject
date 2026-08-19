######################################################
# This is a file of definitions for the Makefile     #
######################################################

######################################################
# Directory Definitions                              #
######################################################
SHELL         =/bin/bash
BACKUPDIR     = backup
REACTLIBDIR   = lib
BINDIR        = bin

######################################################
all: clean genchdirs createstructures structs chemdb
######################################################
install: all runsetup database
######################################################
createstructures: $(REACTLIBDIR)/libbasis.a
	cd createstructures; make all

######################################################
clean:
	rm -rf lib
	rm -f ./*/*.o
	cd chemdb; rm -f chemdb
	cd $(BINDIR);rm -f createstructures
	cd $(BINDIR);rm -f chemdb
	rm -f -r  genc
	rm -f -r genh
	rm -f -r tmp
	mkdir lib
runsetup:
	chmod a+x bin/runsetup.sh
	$(CCROOT)/bin/runsetup.sh

database:
	$(CCROOT)/programs/setup/readmols.sh
	$(CCROOT)/programs/setup/readsubsset.sh
	$(CCROOT)/programs/setup/readpats.sh
	$(CCROOT)/programs/setup/bensonsetup.sh

chemdb: library
	cd chemdb; rm -f chemdb; make chemdb

library:\
	$(REACTLIBDIR)/libbasis.a\
	$(REACTLIBDIR)/libdatmat.a\
	$(REACTLIBDIR)/libdbase.a\
	$(REACTLIBDIR)/libcomlib.a\
	$(REACTLIBDIR)/libgraphs.a\
	$(REACTLIBDIR)/libstatistics.a\
	$(REACTLIBDIR)/libmolecules.a\
	$(REACTLIBDIR)/libmolprops.a\
	$(REACTLIBDIR)/libnaming.a\
	$(REACTLIBDIR)/libproperty.a\
	$(REACTLIBDIR)/librxn.a\
	$(REACTLIBDIR)/libspectrum.a\
	$(REACTLIBDIR)/libgentrans.a\
	$(REACTLIBDIR)/libchemdb.a\
	$(REACTLIBDIR)/libstatistics.a\
	$(REACTLIBDIR)/libcluster.a\
	$(REACTLIBDIR)/libstructgen.a

$(REACTLIBDIR)/libbasis.a:
	pushd $(REACTROOT)/basis;\
	make library;\
	popd

$(REACTLIBDIR)/libcomlib.a:
	pushd $(REACTROOT)/comlib;\
	make library;\
	popd

$(REACTLIBDIR)/libdatmat.a:
	pushd $(REACTROOT)/datmat;\
	make library;\
	popd

$(REACTLIBDIR)/libdbase.a:
	pushd $(REACTROOT)/dbase;\
	make library;\
	popd

$(REACTLIBDIR)/libgentrans.a:
	pushd $(REACTROOT)/gentrans;\
	make library;\
	popd

$(REACTLIBDIR)/libgraphs.a:
	pushd $(REACTROOT)/graphs;\
	make library;\
	popd

$(REACTLIBDIR)/libmolecules.a:
	pushd $(REACTROOT)/molecules;\
	make library;\
	popd

$(REACTLIBDIR)/libmolprops.a:
	pushd $(REACTROOT)/molprops;\
	make library;\
	popd

$(REACTLIBDIR)/libnaming.a:
	pushd $(REACTROOT)/naming;\
	make library;\
	popd

$(REACTLIBDIR)/libproperty.a:
	pushd $(REACTROOT)/property;\
	make library;\
	popd

$(REACTLIBDIR)/librxn.a:
	pushd $(REACTROOT)/rxn;\
	make library;\
	popd

$(REACTLIBDIR)/libchemdb.a:
	pushd $(REACTROOT)/chemdb;\
	make library;\
	popd

$(REACTLIBDIR)/libcommand.a:
	pushd $(REACTROOT)/command;\
	make library;\
	popd

$(REACTLIBDIR)/libspectrum.a:
	pushd $(REACTROOT)/spectrum;\
	make library;\
	popd

$(REACTLIBDIR)/libstatistics.a:
	pushd $(REACTROOT)/statistics;\
	make library;\
	popd

$(REACTLIBDIR)/libcluster.a:
	pushd $(REACTROOT)/cluster;\
	make library;\
	popd
$(REACTLIBDIR)/libstructgen.a:
	pushd $(REACTROOT)/structgen;\
	make library;\
	popd

structs: 
	pushd comlib;make str_form;popd
	pushd datmat;make str_form;popd
	pushd dbase;make str_form;popd
	pushd gentrans;make str_form;popd
	pushd graphs;make str_form;popd
	pushd molecules;make str_form;popd
	pushd molprops;make str_form;popd
	pushd property;make str_form;popd
	pushd rxn;make str_form;popd
	pushd chemdb;make str_form;popd
	pushd statistics; make str_form;popd
	pushd cluster; make str_form;popd
	pushd spectrum; make str_form;popd
	pushd structgen; make str_form;popd

genchdirs:
	mkdir genc
	mkdir genh
	mkdir tmp
	pushd $(REACTROOT)/genc;mkdir comlib;popd
	pushd $(REACTROOT)/genh;mkdir comlib;popd
	pushd $(REACTROOT)/genc;mkdir datmat;popd
	pushd $(REACTROOT)/genh;mkdir datmat;popd
	pushd $(REACTROOT)/genc;mkdir dbase;popd
	pushd $(REACTROOT)/genh;mkdir dbase;popd
	pushd $(REACTROOT)/genc;mkdir gentrans;popd
	pushd $(REACTROOT)/genh;mkdir gentrans;popd
	pushd $(REACTROOT)/genc;mkdir graphs;popd
	pushd $(REACTROOT)/genh;mkdir graphs;popd
	pushd $(REACTROOT)/genc;mkdir molecules;popd
	pushd $(REACTROOT)/genh;mkdir molecules;popd
	pushd $(REACTROOT)/genc;mkdir molprops;popd
	pushd $(REACTROOT)/genh;mkdir molprops;popd
	pushd $(REACTROOT)/genc;mkdir property;popd
	pushd $(REACTROOT)/genh;mkdir property;popd
	pushd $(REACTROOT)/genc;mkdir rxn;popd
	pushd $(REACTROOT)/genh;mkdir rxn;popd
	pushd $(REACTROOT)/genc;mkdir chemdb;popd
	pushd $(REACTROOT)/genh;mkdir chemdb;popd
	pushd $(REACTROOT)/genc;mkdir stats;popd
	pushd $(REACTROOT)/genh;mkdir stats;popd
	pushd $(REACTROOT)/genc;mkdir spectrum;popd
	pushd $(REACTROOT)/genh;mkdir spectrum;popd
	pushd $(REACTROOT)/genc;mkdir cluster;popd
	pushd $(REACTROOT)/genh;mkdir cluster;popd
	pushd $(REACTROOT)/genc;mkdir structgen;popd
	pushd $(REACTROOT)/genh;mkdir structgen;popd



