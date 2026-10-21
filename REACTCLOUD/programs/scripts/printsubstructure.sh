#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
#set verbose on

set CHEMPROG        = $REACTROOT/bin/runchem.sh
set INPPRINT        = $REACTROOT/programs/inputs/PrintSubstructure.inp
set TEMPDIR         = $REACTROOT/tmp

pushd $TEMPDIR >& /dev/null

sed "s/xxxxx/$1/g"\
       $REACTROOT/programs/inputs/Molecule.inp  >! xxx.mol

echo "------------------------------------"
cat xxx.mol
echo "------------------------------------"

$CHEMPROG test < $INPPRINT >! substructure.out
if ( -f molecule.out ) then
    cat molecule.out
    rm molecule.out
endif
rm substructure.out
rm xxx.mol
popd
echo "EndOfOutput"
