#!/bin/csh
# ---------------------------------------------------------------------------
# Script to Read in the set of extra substructures
# ---------------------------------------------------------------------------
set verbose on
#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set DATADIR         = $REACTROOT/data
set PROGRAMDIR      = $REACTROOT/programs
set PROGRAM         = $REACTROOT/programs/setup/singlesub.sh

#--------------------------------------------------------------------------
pushd $DATADIR/DB
rm SubStructures.dbf
popd
#--------------------------------------------------------------------------
pushd $DATADIR/mol/subs
rm all.sdf


popd
