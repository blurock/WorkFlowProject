#!/bin/csh
# ---------------------------------------------------------------------------
# Script 2: Check for Reaction Duplicates & Molecule Existence
# ---------------------------------------------------------------------------

if ( $#argv != 1 ) then
  echo "Usage: $0 FileRoot"
  echo "        FileRoot : The reaction file root name (e.g. TestRxnList)"
  exit(1)
endif

set CALLDIR    = `pwd`
set INFILEROOT = $1
set REFERENCE  = $REACTROOT/programs/inputs/ExistenceCheckReactionPatterns.inp
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

$CHEMPROG read < read.prg >! $TEMPDIR/existencecheck.rawout
popd > /dev/null

## mv $TEMPDIR/$INFILEROOT.out $INFILEROOT.Existence.out
mv $TEMPDIR/existencecheck.rawout $INFILEROOT.Existence.rawout



grep -E "Reaction|Match|Database|Equivalence" $INFILEROOT.Existence.rawout
