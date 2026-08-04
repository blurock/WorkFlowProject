#! /bin/tcsh -f
# ---------------------------------------------------------------------------
# Script to Read in the set of substructures
# ---------------------------------------------------------------------------
#set verbose on
#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set DATADIR         = $REACTROOT/data
set PROGRAMDIR      = $REACTROOT/programs
set PROGRAM         = $REACTROOT/programs/scripts/readsubs.sh

set SUBSTRUCTURES = $1

cat $SUBSTRUCTURES.sdf >> all.sdf
$PROGRAM $SUBSTRUCTURES >! $SUBSTRUCTURES.rawout

