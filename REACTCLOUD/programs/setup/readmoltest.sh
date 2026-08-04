#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
set verbose on

if ( $#argv != 1 ) then
  echo "Usage: readmoltest.sh File"
  echo "        File     :    Root of information file"
  echo "                      The file is assumed to be in data/mol/molsdf directory"
  exit(1)
endif
set ROOTNAME = $1
#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set DATADIR         = $REACTROOT/data/DB
set PROGRAMDIR      = $REACTROOT/programs
set CHEMPROG        = $REACTROOT/programs/scripts/readmol.sh
set CHEMPROPS       = $REACTROOT/programs/scripts/readmolprops.sh
set THERMO          = $REACTROOT/programs/scripts/readchemkin.sh
#--------------------------------------------------------------------------
pushd $DATADIR
rm Molecules.dbf
popd
#--------------------------------------------------------------------------
pushd $PROGRAMDIR
echo ---------------------------------------------------------------------------
echo Run: $CHEMPROG
$CHEMPROG $ROOTNAME
echo ---------------------------------------------------------------------------
echo Run: $CHEMPROPS
$CHEMPROPS $ROOTNAME-names
echo ---------------------------------------------------------------------------
echo Run: $THERMO
$THERMO $ROOTNAME

