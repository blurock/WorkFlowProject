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
$CHEMPROG O2AdditionToRadical
$CHEMPROG QOOHFormation
$CHEMPROG EthylRadicalToOlefin
$CHEMPROG HRingIsomerization
$CHEMPROG AlkoxyFromRadicalAndPeroxy
$CHEMPROG ROOHFromRO2AndPeroxy
$CHEMPROG PeroxyFromHydroPeroxy
$CHEMPROG AlkoxyFromPeroxy
$CHEMPROG CyclicEtherFromQOOH
$CHEMPROG OlefinFromCOOH
$CHEMPROG OlefinCarbonylFromQOOH
$CHEMPROG QOOHQOO
$CHEMPROG KetoHydroPeroxideDecomposition
$CHEMPROG HAbstractionAlkenyl
$CHEMPROG AdditionToOlefin
$CHEMPROG AldehydeRadicalDecomp
$CHEMPROG KetoAldCRadDecomposition
$CHEMPROG KetoAldDecomposition
$CHEMPROG DiKetoAldDecomp
$CHEMPROG BetaOlefinDecomp
$CHEMPROG OlefinToAldehyde
$CHEMPROG HAbsAlphaKetone
$CHEMPROG KeteneFormation
$CHEMPROG KeteneDecomp
$CHEMPROG Decomposition
$CHEMPROG PropylRadicalToEthene
$CHEMPROG AldehydeHAbstraction
$CHEMPROG AlphaAbstractionFromOlefin
$CHEMPROG EthenylToEthyne
$CHEMPROG PeroxyOlefinFormationFromAlphaOlefinRadical
$CHEMPROG PeroxyOlefinDecomposition
$CHEMPROG PropenylRadicalIsomerization
$CHEMPROG HLossEthylRadicalToOlefin
$CHEMPROG HLoseFromCarbon
$CHEMPROG AlkOHOODecomposition
$CHEMPROG AlkOHOOFormation
$CHEMPROG EthynylDecomposition
$CHEMPROG EthyneDecomposition
$CHEMPROG EthyneHAbstraction
$CHEMPROG AlkoxyDecomp
$CHEMPROG OxygenAtomToPropene
$CHEMPROG AddHydroxylToPropene
$CHEMPROG KeteneDecompOHToCO2
$CHEMPROG KetoPeroxyDecompositionLong
$CHEMPROG BetaOlefinDecompRadical
$CHEMPROG BetaAldRadButeneDecomp
$CHEMPROG PenteneAldRadDecomp
$CHEMPROG RO2Isomerization
$CHEMPROG KetoneDecompToAlkene-Alkyl
$CHEMPROG AldehydeDecompToAlkene-Alkyl
$CHEMPROG AldehydeDecompToKetylAlkene-Alkyl
$CHEMPROG AldehydeDecompToKetylAndch2co-Alkyl
$CHEMPROG KetoneDecompToAlkene-Alkenyl
$CHEMPROG KetoneDecompToAlkene-Alkyl
$CHEMPROG KetoneDecompToAlkeneAndch2co-Alkyl
$CHEMPROG KetoneDecompToKetylAlkene-Alkyl
$CHEMPROG CyclicEther-Ring
$CHEMPROG CyclicEther-3Ring-1
$CHEMPROG PentenylDecompToPropenyl.
$CHEMPROG CyclicEther-3Ring-2
$CHEMPROG KetoneAdditionOH-Alpha
$CHEMPROG AlphaOlefinRadicalDecompOH
$CHEMPROG AlphaOlefinRadicalDecompO
$CHEMPROG AlphaHAbstractionFromOlefin
$CHEMPROG AlphaOlefinRadicalDecompHO2
$CHEMPROG PentenylDecompToPropenyl
$CHEMPROG HAbsAlphaKetone2
$CHEMPROG CyclicEther-3Ring-2
$CHEMPROG KetoneAdditionOH-Alpha
$CHEMPROG AlphaOlefinRadicalDecompOH
$CHEMPROG AlphaHAbstractionFromOlefin
$CHEMPROG AlphaOlefinRadicalDecompHO2
$CHEMPROG PentenylDecompToPropenyl
$CHEMPROG HAbsAlphaKetone2
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
