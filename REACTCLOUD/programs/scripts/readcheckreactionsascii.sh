#!/bin/csh
# ---------------------------------------------------------------------------
# Script: Read & Check ASCII Reactions
# ---------------------------------------------------------------------------

if ( $#argv != 1 ) then
  echo "Usage: $0 FileRoot"
  echo "        FileRoot : The reaction file root name (e.g. TestRxnList)"
  exit(1)
endif

set CALLDIR    = `pwd`
set INFILEROOT = $1
set REFERENCE  = $REACTROOT/programs/inputs/ReadCheckReactionsASCII.inp
set CHEMPROG   = $REACTROOT/bin/runchem.sh
set TEMPDIR    = $REACTROOT/tmp
set TEMPFILE   = $REACTROOT/tmp/read.prg

sed "s/XXXXX/$INFILEROOT/g" $REFERENCE >! $TEMPFILE

pushd $TEMPDIR > /dev/null
if ( -e $CALLDIR/$INFILEROOT.lst ) then
  cp $CALLDIR/$INFILEROOT.* .
else if ( -e $REACTROOT/data/rxn/$INFILEROOT.lst ) then
  cp $REACTROOT/data/rxn/$INFILEROOT.* .
endif

$CHEMPROG read < read.prg >! $TEMPDIR/readcheckreactionsascii.rawout
popd > /dev/null

echo "Read & check ASCII reactions completed for $INFILEROOT."
