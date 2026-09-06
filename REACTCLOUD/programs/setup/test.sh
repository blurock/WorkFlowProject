#!/bin/csh
# ---------------------------------------------------------------------------
# Script to Read in the set of substructures
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

$PROGRAM subsMethylAlcohol
$PROGRAM subsEthenylRadical
$PROGRAM subsPropylRadical
$PROGRAM subsPropyl
$PROGRAM subsAlkOHRadical
$PROGRAM subsAlkOHOORadical
$PROGRAM subsAlkPeroxy
$PROGRAM subsAlphaOlefinOO
$PROGRAM subsEthylAlcohol
$PROGRAM subsKetoAlphaRadical
$PROGRAM subsPropenylRadical
$PROGRAM subsAlkenyl
$PROGRAM subsEthyne
$PROGRAM subsPropyne
