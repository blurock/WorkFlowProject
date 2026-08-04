#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
#set verbose on

set CHEMPROG        = $REACTROOT/bin/runchem.sh
set INPPRINT        = $REACTROOT/programs/inputs/PrintMoleculeAsGraph.inp
set TEMPDIR         = $REACTROOT/tmp

pushd $TEMPDIR

cat <<EOF > xxx.mol
$1
EOF
$CHEMPROG test < $INPPRINT
cat test.out

rm test.out
rm xxx.mol
popd
