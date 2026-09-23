#!/bin/tcsh
# ---------------------------------------------------------------------------
#
# Script to Check Reaction Patterns against the database
#
# ---------------------------------------------------------------------------

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
pushd $TEMPDIR
$CHEMPROG read < read.prg

rm $TEMPFILE
rm $TEMPFILE1
popd
if ( -f $TEMPDIR/$PATTERN.out && "$CURRDIR" != "$TEMPDIR" ) then
    mv $TEMPDIR/$PATTERN.out $PATTERN.out
endif
