#!/bin/tcsh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
#set verbose on

set CHEMPROG        = $REACTROOT/bin/runchem.sh
set INPPRINT        = $REACTROOT/programs/inputs/PrintRxnPattern.inp
set TEMPDIR         = $REACTROOT/tmp

pushd $TEMPDIR >& /dev/null


sed "s/xxxxx/$1/g"\
$REACTROOT/programs/inputs/RxnPattern.inp > xxx.rxn


echo "Start getting reaction pattern"
$CHEMPROG test < $INPPRINT >! rxnpat.out
echo "Reaction pattern results"
echo "~"
cat test.out
echo "~"

rm test.out
rm xxx.rxn
popd
echo "EndOfOutput"
