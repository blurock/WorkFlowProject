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
#-------------------------------------------------------------------------
set MOLECULE        = $1
set REFERENCE       = $REACTROOT/programs/inputs/MoleculeProperties.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE        = $REACTROOT/tmp/read.prg

#--------------------------------------------------------------------------
# Set up Molecule list file
#--------------------------------------------------------------------------
pushd $TEMPDIR

cat <<EOF >! read.mol 
$MOLECULE
EOF
cp 
$CHEMPROG read < $REFERENCE
rm read.mol
popd
mv $TEMPDIR/read.out $MOLECULE.out

