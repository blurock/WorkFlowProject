#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv != 1 ) then
  echo "Usage: readmol.sh File"
  echo "        File     :    The molecule information file"
  echo "                      The file is assumed to be in data/mol/molsdf direction"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set MOLECULE        = $1
set MOLSDF          = molsdf/$MOLECULE
set REFERENCE       = $REACTROOT/programs/inputs/ReadMoleculesFromFile.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE1        = $REACTROOT/tmp/read1.prg
set TEMPFILE        = $REACTROOT/tmp/read.prg

#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/YYYYY/$MOLECULE/g"\
        $REFERENCE >! $TEMPFILE1
sed "s/XXXXX/$MOLECULE/g"\
        $TEMPFILE1 >! $TEMPFILE
#cat $TEMPFILE
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read < read.prg

#rm $TEMPFILE
rm $TEMPFILE1
popd
mv $TEMPDIR/$MOLECULE.out $MOLECULE.out

