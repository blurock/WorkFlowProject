#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
#set verbose on
#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
if ( ! $?REACTROOT ) then
  set SCRIPT_DIR = `dirname "$0"`
  setenv REACTROOT `cd "$SCRIPT_DIR/.." && pwd`
endif

set DATADIR         = $REACTROOT/data
set COMMANDDIR      = $REACTROOT/command
set STATICFILE      = $DATADIR/stat-inf.dat

if ( $#argv != 1 ) then
  echo "Usage: $0 rootname"
  echo "        rootname     :    The root name of the run"
  exit(1)
endif

set RUNROOT         = $1

$REACTROOT/bin/chemdb $RUNROOT 0 $COMMANDDIR $STATICFILE

exit(0)
