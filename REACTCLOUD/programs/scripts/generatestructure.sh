#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
set verbose on

if ( $#argv != 1 ) then
  echo "Usage: generatestructure.sh File"
  echo "        Root     :    The molecule property file"
  echo "                      The file is assumed to be in data/mol/molsdf directory"
  exit(1)
endif

set ROOT            = $1
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set INPGEN          = $REACTROOT/programs/inputs/GenerateStructure.inp
set XSLGEN          = $REACTROOT/programs/inputs/GenerateStructure.xsl
set TEMPDIR         = $REACTROOT/tmp
set PATTERN         = '$$$$$'


xsltproc $XSLGEN $ROOT.cml > $ROOT.txt

$CHEMPROG $ROOT < $INPGEN >! $TEMPDIR/tmp.out
cat $TEMPDIR/tmp.out
rm $TEMPDIR/tmp.out

echo $PATTERN

sed "s/$PATTERN/M  END/g"\
        structures.sdf >! structures.mol
