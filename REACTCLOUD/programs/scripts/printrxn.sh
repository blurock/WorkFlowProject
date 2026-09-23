#!/bin/csh
# ---------------------------------------------------------------------------
# Script 4: Print Reaction Information
# ---------------------------------------------------------------------------

if ( $#argv != 1 ) then
  echo "Usage: $0 FileRoot"
  echo "        FileRoot : The reaction file root name (e.g. TestRxnList)"
  exit(1)
endif

set INFILEROOT = $1
set REFERENCE  = $REACTROOT/programs/inputs/PrintReaction.inp
set CHEMPROG   = $REACTROOT/bin/runchem.sh
set TEMPDIR    = $REACTROOT/tmp
set TEMPFILE   = $REACTROOT/tmp/read.prg

sed "s/XXXXX/$INFILEROOT/g" $REFERENCE >! $TEMPFILE

pushd $TEMPDIR > /dev/null
$CHEMPROG read < read.prg >! $TEMPDIR/printrxn.rawout
popd > /dev/null

echo "Reaction printing completed for $INFILEROOT."
