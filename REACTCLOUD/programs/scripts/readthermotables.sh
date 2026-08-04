#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a new substructure file to the database
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv != 1 ) then
  echo "Usage: $0 TableRoot"
  echo "    TableRoot     :    The root name of the table to be read in"
  echo "                       The directory is the standard tables directory"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
# The program and the input file pattern
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set REFERENCE       = $REACTROOT/programs/inputs/ReadBensonTable.inp

# The root name of the table
set INPUTROOT         = $1

set TEMPDIR         = $REACTROOT/tmp
set TEMPPRG         = $TEMPDIR/read.prg
set TEMPOUTFILE     = $TEMPDIR/read.out

sed "s/XXXXXXXXXX/$INPUTROOT/g"\
        $REFERENCE >! $TEMPPRG

#--------------------------------------------------------------------------
# Put Table in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read < $TEMPPRG
popd
