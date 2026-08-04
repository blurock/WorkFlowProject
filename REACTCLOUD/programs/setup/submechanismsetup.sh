#! /bin/tcsh -f

# ---------------------------------------------------------------------------
#
# Script to set up the submechanism database for a particular molecule
#
# ---------------------------------------------------------------------------
# set verbose on

if ( $#argv != 1 ) then
  echo "Usage: submechanismsetup.sh Molecule"
  echo "        File     :    The seed molecule for the submechanisms"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set TMPDIR          = $REACTROOT/tmp
set MECHSDIR        = $REACTROOT/data/mechs/submechanisms
set PROGRAMDIR      = $REACTROOT/programs
set CHEMPROG        = $REACTROOT/programs/scripts/runchain.sh
set MOLECULE        = $1

#--------------------------------------------------------------------------
#rm $REACTROOT/data/DB/RxnMechanisms.dbf
#--------------------------------------------------------------------------
#--------------------------------------------------------------------------
# In tmp directory, run the chain
#--------------------------------------------------------------------------

cp $MECHSDIR/BasicLowTemp.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen $MOLECULE-BasicLowTemp

## Radical
cp $MECHSDIR/AlkeneFromRadical.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen $MOLECULE-AlkeneFromRadical

##  ROO
cp $MECHSDIR/PeroxyFromHydrogenPeroxide.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen,hydrogen-peroxide $MOLECULE-PeroxyFromHydrogenPeroxide

cp $MECHSDIR/ROOHFromPeroxylRadical.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen,peroxyl-radical $MOLECULE-ROOHFromPeroxylRadical

## ROOH

cp $MECHSDIR/BetaHPeroxyToOlefin.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen $MOLECULE-BetaHPeroxyToOlefin

cp $MECHSDIR/CyclicEtherFromQOOH.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen $MOLECULE-CyclicEtherFromQOOH

cp $MECHSDIR/OlefinCarbonylFromPeroxy.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen $MOLECULE-OlefinCarbonylFromPeroxy

cp $MECHSDIR/AlkoxyFromPeroxy.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen $MOLECULE-AlkoxyFromPeroxy

cp $MECHSDIR/AlphaHHydroPeroxylIsomerization.lsr mech.lsr
runchain.sh mech $MOLECULE,oxygen $MOLECULE-AlphaHHydroPeroxylIsomerization


