#!/bin/tcsh
# ---------------------------------------------------------------------------
#
# Script to read in molecules and check their existence in database
#
# ---------------------------------------------------------------------------

if ( $#argv != 1 ) then
  echo "Usage: existencecheckmolecules.sh File"
  echo "        File     :    The molecule information file"
  echo "                      The file is assumed to be in current or target directory"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set MOLECULE        = $1
set MOLSDF          = $MOLECULE
set REFERENCE       = $REACTROOT/programs/inputs/ExistenceCheckMoleculesFromFile.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE1       = $REACTROOT/tmp/read1.prg
set TEMPFILE        = $REACTROOT/tmp/read.prg

#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s|YYYYY|$MOLECULE|g"\
        $REFERENCE >! $TEMPFILE1
sed "s|XXXXX|$MOLSDF|g"\
        $TEMPFILE1 >! $TEMPFILE
cp $MOLECULE.sdf $TEMPDIR/$MOLECULE.sdf
#--------------------------------------------------------------------------
# Run Existence Check in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read < read.prg > $MOLECULE.rawout

rm $TEMPFILE
rm $TEMPFILE1
rm $MOLECULE.sdf
popd
mv $TEMPDIR/$MOLECULE.out $MOLECULE.out
mv $TEMPDIR/$MOLECULE.Existence.out $MOLECULE.Existence.out
mv $TEMPDIR/$MOLECULE.rawout $MOLECULE.Existence.rawout
