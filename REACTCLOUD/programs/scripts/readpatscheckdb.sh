#!/bin/tcsh
# ---------------------------------------------------------------------------
#
# Script to Check Reaction Patterns against the database
#
# ---------------------------------------------------------------------------
set verbose on

if ( $#argv != 1 ) then
  echo "Usage: readpatscheckdb.sh File"
  echo "        File     :    The reaction pattern definition file"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set PATTERN         = $1
set REFERENCE       = $REACTROOT/programs/inputs/TestCheckRxnPatternsInDatabase.inp
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE1       = $REACTROOT/tmp/read1.prg
set TEMPFILE        = $REACTROOT/tmp/read.prg

#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s|YYYYY|$PATTERN|g"\
        $REFERENCE >! $TEMPFILE1
sed "s|XXXXX|$PATTERN|g"\
        $TEMPFILE1 >! $TEMPFILE

#--------------------------------------------------------------------------
# Check Reaction Patterns in Database
#--------------------------------------------------------------------------
set CURRDIR = `pwd`

cp $PATTERN.lst $TEMPDIR/$PATTERN.lst
pushd $TEMPDIR
$CHEMPROG read < read.prg > $PATTERN.rawout

rm $TEMPFILE
rm $TEMPFILE1

popd
rm $TEMPDIR/$PATTERN.lst
if ( -f $TEMPDIR/$PATTERN..out && "$CURRDIR" != "$TEMPDIR" ) then
    mv $TEMPDIR/$PATTERN..out $PATTERN..out
endif
if ( -f $TEMPDIR/$PATTERN.Existence.out && "$CURRDIR" != "$TEMPDIR" ) then
    mv $TEMPDIR/$PATTERN.Existence.out $PATTERN.Existence.out
endif
if ( -f $TEMPDIR/$PATTERN.rawout && "$CURRDIR" != "$TEMPDIR" ) then
    mv $TEMPDIR/$PATTERN.rawout $PATTERN.rawout
endif
