#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to read in a list of molecule names and
#   then print out their abbreviated name correspondences
#
# ---------------------------------------------------------------------------
set verbose on

if ( $#argv != 3 ) then
  echo "Usage: alternativenames.sh List Corrs"
  echo "        Name     :    The alternative name 
  echo "                      for example, 'CHEMKIN' or 'SHORT'
  echo "        List     :    The root of the molecule list file (extension .mol)"
  echo "        Corrs    :    The root of the correspondence list (extension .lst)"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set NAME            = $1
set LIST            = $2
set CORRS           = $3
set REFERENCE       = $REACTROOT/programs/inputs/AlternativeNames.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE1       = $REACTROOT/tmp/read1.prg
set TEMPFILE2       = $REACTROOT/tmp/read2.prg
set TEMPFILE        = $REACTROOT/tmp/read.prg
#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
echo 'REACTROOT=' $REACTROOT
echo $REFERENCE
echo $TEMPDIR/read.mol
echo $LIST.mol
pwd
cat $LIST.mol

cp $LIST.mol $TEMPDIR/read.mol
sed "s/XXXXXXXXXX/read/g"\
        $REFERENCE >! $TEMPFILE1
sed "s/YYYYYYYYYY/read/g"\
        $TEMPFILE1 >! $TEMPFILE2
sed "s/ZZZZZZZZZZ/$NAME/g"\
        $TEMPFILE2 >! $TEMPFILE
#rm $TEMPFILE1
#rm $TEMPFILE2
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read < read.prg
pwd
set verbose on
cat read.lst
echo $CORRS.lst
cat $CORRS.lst
#rm $TEMPFILE
popd
cp $TEMPDIR/read.lst $CORRS.lst
#rm $TEMPDIR/read.lst
#rm $TEMPDIR/read.mol
echo EndOfOutput
