#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule properties to the database
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv != 1 ) then
  echo "Usage: readmol.sh File"
  echo "        File     :    The molecule property file"
  echo "                      The file is assumed to be in data/mol/molsdf directory"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set MOLECULE        = $1
set REFERENCE       = $REACTROOT/programs/inputs/ReadInMoleculeProperties.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE        = $REACTROOT/tmp/read.prg

#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/XXXXX/$MOLECULE/g"\
        $REFERENCE >! $TEMPFILE
#cat $TEMPFILE
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG $MOLECULE < $TEMPFILE

rm $TEMPFILE
popd

mv $TEMPDIR/$MOLECULE.out .

