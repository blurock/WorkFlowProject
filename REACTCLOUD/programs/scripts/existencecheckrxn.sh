#!/bin/csh
# ---------------------------------------------------------------------------
# Script 2: Check for Reaction Duplicates & Molecule Existence
# ---------------------------------------------------------------------------

if ( $#argv != 1 ) then
  echo "Usage: $0 FileRoot"
  echo "        FileRoot : The reaction file root name (e.g. TestRxnList)"
  exit(1)
endif

set INFILEROOT = $1
set REFERENCE  = $REACTROOT/programs/inputs/ExistenceCheckReaction.inp
set CHEMPROG   = $REACTROOT/bin/runchem.sh
set TEMPDIR    = $REACTROOT/tmp
set TEMPFILE   = $REACTROOT/tmp/read.prg

sed "s/XXXXX/$INFILEROOT/g" $REFERENCE >! $TEMPFILE

pushd $TEMPDIR > /dev/null
$CHEMPROG read < read.prg >! $TEMPDIR/existencecheck.rawout
popd > /dev/null

echo "Existence & duplicate check completed for $INFILEROOT."
grep -E "Reaction|Match|Database|Equivalence" $TEMPDIR/existencecheck.rawout
