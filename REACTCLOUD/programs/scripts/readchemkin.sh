#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule properties to the database
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv != 1 ) then
  echo "Usage: readchemkin.sh Root"
  echo "        File     :    The root name of the files"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set CHEMKIN        = $1
set REFERENCE       = $REACTROOT/programs/inputs/ReadAndStoreChemkin.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE        = $REACTROOT/tmp/read.prg

#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/XXXXX/$CHEMKIN/g"\
        $REFERENCE >! $TEMPFILE

cp $REACTROOT/data/mol/molsdf/$CHEMKIN.mol $TEMPDIR/$CHEMKIN.mol
cp $REACTROOT/data/mol/molsdf/$CHEMKIN.thm $TEMPDIR/$CHEMKIN.thm
#cat $TEMPFILE
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG $CHEMKIN < read.prg


popd
#mv $TEMPDIR/$CHEMKIN.out $CHEMKIN.out
#rm $TEMPDIR/$CHEMKIN.mol
#rm $TEMPDIR/$CHEMKIN.thm
#rm $TEMPDIR/read.prg
