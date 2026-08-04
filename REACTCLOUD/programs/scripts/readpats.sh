#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a reaction pattern file to the database
#
# ---------------------------------------------------------------------------
# set verbose on

if ( $#argv != 1 ) then
  echo "Usage: $0 FileRoot"
  echo "        FileRoot     :    The reaction pattern information file root"
  echo "           Input is assumed to be FileRoot.lst"
  echo "           Output is the FileRoot.out file"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set INFILEROOT      = $1
set INFILE          = $INFILEROOT.lst
set OUTFILE         = $INFILEROOT.out

set REFERENCE       = $REACTROOT/programs/inputs/ReadReactionPatterns.inp
set CHEMPROG        = $REACTROOT/bin/runchemprg.sh

set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE        = $REACTROOT/tmp/read.prg
#set DATAFILE        = $REACTROOT/data/rxn/rxnpats/read.lst
set DATAFILE        = $REACTROOT/tmp/read.lst
set TEMPOUTFILE     = $REACTROOT/tmp/read.out
#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/XXXXX/$INFILEROOT/g"\
        $REFERENCE >! $TEMPFILE
pwd
cp $INFILE $DATAFILE
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read

#rm $TEMPFILE
#rm $DATAFILE
popd
mv $TEMPOUTFILE $OUTFILE
 
