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

$CHEMPROG AlkylIsomerization
$CHEMPROG RO2ToAlkoxy
$CHEMPROG AlkenylDecompToAlkyne
$CHEMPROG RO2IsomerizationCyclohexane
$CHEMPROG CyclohexaneHAbstraction
$CHEMPROG RO2IsomerizationCyclohexane
$CHEMPROG OOQOOH-Isomerization-Ring
$CHEMPROG Decomp-1,3-dibutanal-4-yl
$CHEMPROG Decomp-1,4-dibutanal-1-yl
$CHEMPROG CyclohexaneCyclicEtherFormation
popd


