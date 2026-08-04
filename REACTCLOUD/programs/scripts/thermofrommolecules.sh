#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file and calculate thermo properties
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv != 1 ) then
  echo "Usage: thermofrommolecules.sh File"
  echo "        File     :    The molecule information file"
  echo "                      The file is assumed to be in data/mol/molsdf direction"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set MOLECULE        = $1
set REFERENCE       = $REACTROOT/programs/inputs/CalculateThermo.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE1        = $REACTROOT/tmp/read1.prg
set TEMPFILE        = $REACTROOT/tmp/read.prg
set BENSON          = $TEMPDIR/$MOLECULE.benson
#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/XXXXX/$MOLECULE/g"\
        $REFERENCE >! $TEMPFILE1
#cat $TEMPFILE
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read < read.prg

rm $TEMPFILE
popd
mv $BENSON .
echo EndOfOutput
