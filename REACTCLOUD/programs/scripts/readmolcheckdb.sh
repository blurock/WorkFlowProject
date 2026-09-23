#!/bin/tcsh
# ---------------------------------------------------------------------------
#
# Script to Check molecules from SDF file against the database
#
# ---------------------------------------------------------------------------

if ( $#argv != 1 ) then
  echo "Usage: readmolcheckdb.sh File"
  echo "        File     :    The molecule information file"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set MOLECULE        = $1
set MOLSDF          = molsdf/$MOLECULE
set REFERENCE       = $REACTROOT/programs/inputs/TestCheckMoleculesInDatabase.inp
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

#--------------------------------------------------------------------------
# Check Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read < read.prg

rm $TEMPFILE
rm $TEMPFILE1
popd
mv $TEMPDIR/$MOLECULE.out $MOLECULE.out
