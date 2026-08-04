#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule properties to the database
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv != 1 ) then
  echo "Usage: benson2chemkin.sh File"
  echo "        File     :    The benson values as ASCII property file"
  echo "                      The file is assumed to have the extension '.lst'"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set MOLECULE        = $1
set REFERENCE       = $REACTROOT/programs/inputs/BensonToChemkin.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE        = $REACTROOT/tmp/read.prg
set BENFILE         = $MOLECULE.lst
set SDFFILE         = $MOLECULE.sdf
set MOLTMPDIR       = $REACTROOT/data/mol/molsdf/tmp
set NASA            = $TEMPDIR/NasaPolynomials.thm
set NASAOUT         = $MOLECULE.thm
#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/XXXXX/$MOLECULE/g"\
        $REFERENCE >! $TEMPFILE
#cat $TEMPFILE
#--------------------------------------------------------------------------
# Move file to mol/molsdf/tmp
#--------------------------------------------------------------------------
cp $BENFILE $MOLTMPDIR
cp $SDFFILE $MOLTMPDIR
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG molsdf/$MOLECULE < read.prg

rm $TEMPFILE
rm $MOLTMPDIR/$BENFILE
rm $MOLTMPDIR/$SDFFILE
popd
cp $NASA $NASAOUT
rm $NASA
echo EndOfOutput

