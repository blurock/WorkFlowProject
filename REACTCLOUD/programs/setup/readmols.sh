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
set DATADIR         = $REACTROOT/data/DB
set PROGRAMDIR      = $REACTROOT/programs
set CHEMPROG        = $REACTROOT/programs/scripts/readmol.sh
set CHEMPROPS       = $REACTROOT/programs/scripts/readmolprops.sh
set THERMO          = $REACTROOT/programs/scripts/readchemkin.sh
#--------------------------------------------------------------------------
pushd $DATADIR
rm Molecules.dbf
popd
#--------------------------------------------------------------------------
pushd $PROGRAMDIR
$CHEMPROG C0HO
$CHEMPROPS C0HO-names
$THERMO C0HO
$CHEMPROG C1HO
$CHEMPROPS C1HO-names
$THERMO C1HO
$CHEMPROG C2HO
$CHEMPROPS C2HO-names
$THERMO C2HO
$CHEMPROG C3HO
$CHEMPROPS C3HO-names
$THERMO C3HO
$CHEMPROG C4H
$CHEMPROPS C4H-names
$THERMO C4H
$CHEMPROG C4HO
$CHEMPROPS C4HO-names
$THERMO C4HO
$CHEMPROG C4HO2
$CHEMPROPS C4HO2-names
$THERMO C4HO2
$CHEMPROG C4HO3
$CHEMPROPS C4HO3-names
$THERMO C4HO3
$CHEMPROG C4HO4
$CHEMPROPS C4HO4-names
$THERMO C4HO4

$CHEMPROG n-alkanesC5-C10
$CHEMPROPS n-alkanesC5-C10-names
$CHEMPROG alkeneC5-C10
$CHEMPROPS alkeneC5-C10-names
# $CHEMPROG methylpentanes
# $CHEMPROPS methylpentanes-names
# $CHEMPROG 22dimethylC3C4
# $CHEMPROPS 22dimethylC3C4-names
$CHEMPROG n-alkaneC11-C15
$CHEMPROPS n-alkaneC11-C15-names
# $CHEMPROG cyclohexanes
#$CHEMPROG methylalkanesC4-C10
#$CHEMPROPS methylalkanesC4-C10-names
#$CHEMPROG 22dimethylalkanes
#$CHEMPROG Nitrogen
$CHEMPROG alkradicalsC5-C7
