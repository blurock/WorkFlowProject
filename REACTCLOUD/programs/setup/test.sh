#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a molecule file to the database
#
# ---------------------------------------------------------------------------
set verbose on

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set DATADIR         = $REACTROOT/data
set PROGRAMDIR      = $REACTROOT/programs
set CHEMPROG        = $REACTROOT/programs/scripts/readpats.sh

#--------------------------------------------------------------------------
pushd $DATADIR
rm SubStructures.dbf
popd
#--------------------------------------------------------------------------
rm $REACTROOT/data/DB/ReactionPatterns.dbf
pushd $DATADIR/rxn/rxnpats

$CHEMPROG HAbstraction
popd
