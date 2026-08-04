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

$PROGRAM subsMolecules
$PROGRAM subsCarbon2
$PROGRAM subsEthene
$PROGRAM subsAlphaOlefin
$PROGRAM subsAlphaOlefin2
$PROGRAM subsBetaOlefin
$PROGRAM subsLongerRadicalChains
$PROGRAM subsAldKetone
$PROGRAM subsPeroxy
$PROGRAM subsPeroxy2
$PROGRAM subsAldPeroxy
$PROGRAM subsAldPeroxy2
$PROGRAM subsAldPeroxy3
$PROGRAM subsCarbon
$PROGRAM subsChainPeroxy
$PROGRAM subsCyclicEthers
$PROGRAM subsDiPeroxy
$PROGRAM subsEthylRadical
$PROGRAM subsKetoHydroPeroxide
$PROGRAM subsOOQOOH
$PROGRAM subsAlkenyl
$PROGRAM subsKetene
$PROGRAM subsEthane
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
$PROGRAM subsPeroxyPropeneRadical
$PROGRAM subsPropene
$PROGRAM subsAlkoxy
$PROGRAM subsAlkPeroxy
$PROGRAM subsKeteneCR3
$PROGRAM subsCyclicEthers2
$PROGRAM subsCyclicEthers3
$PROGRAM subsCyclicEthers4
$PROGRAM subsAldKetone2
$PROGRAM subsAldPeroxyLong
$PROGRAM subsMolecules2
$PROGRAM subsBetaOlefinRadical
$PROGRAM subsBetaAldRadButene
$PROGRAM subsC3R5COCR2
$PROGRAM subsAldKetone3
$PROGRAM subsAldKetone4
$PROGRAM subsAldKetone5
$PROGRAM subsAldKetone6
$PROGRAM subsKetoAlkene
$PROGRAM subsKetoAlkene2
$PROGRAM subsKetoAlkeneAlphaRadical
$PROGRAM subsAldKetone7
#$PROGRAM subsAldKetone8 (repeated in subsAldKetone.sdf
#$PROGRAM subsAldKetone9 (repeated in subsKetoAlkene.sdf
$PROGRAM subsAldKetone10
$PROGRAM subsAldKetone11
$PROGRAM subsCyclicEthers5
$PROGRAM subsAlkene3
$PROGRAM subsLongerRadicalChains3Carbons
$PROGRAM subsLongerRadicalChains4Carbons
$PROGRAM subsLongerRadicalChains5Carbons
$PROGRAM subsLongerRadicalChains6Carbons
$PROGRAM subsLongerRadicalChainsAlkene
$PROGRAM subsPropenylRadical3
$PROGRAM subsAlkoxyRadical
$PROGRAM subsAlkoxyRadical2
$PROGRAM cyclohexaneSubstructures
$PROGRAM subsPeroxyCyclohexane
$PROGRAM cyclohexaneSubstructures
$PROGRAM subsHydroperoxyPeroxyCyclohexaneRadical
$PROGRAM subsHydroperoxyKetylCyclohexane
$PROGRAM cyclohexaneCyclicEther
popd
