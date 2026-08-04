#! /usr/bin/tcsh -f

set DATADIR         = $REACTROOT/data
set COMMANDDIR      = $REACTROOT/command
set STATICFILE      = $DATADIR/StandardMeta.mta

if ( $#argv != 1 ) then
  echo "Usage: $0 molname"
  echo "        molname     :    The name of the molecule file"
  exit(1)
endif

set RUNROOT         = $1
echo $STATICFILE

naming $STATICFILE $RUNROOT

exit(0)
