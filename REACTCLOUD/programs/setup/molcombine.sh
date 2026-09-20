#! /bin/tcsh -f



if ( $#argv != 1 ) then
  echo "Usage: molcombine.sh Molecule"
  echo "        File     :    The seed molecule for the set of submechanisms"
  exit(1)
endif
set COMBINE         = $REACTROOT/programs/scripts/combinemech.sh

set MOLECULE = $1

cat <<EOF >! combine.lst
$MOLECULE-BasicLowTemperatureV3
$MOLECULE-AlkeneFromRadical
$MOLECULE-ROOHFromPeroxylRadical
$MOLECULE-PeroxyFromHydrogenPeroxide
$MOLECULE-BetaHPeroxyToOlefin
$MOLECULE-CyclicEtherFromQOOH
$MOLECULE-OlefinCarbonylFromPeroxy
$MOLECULE-AlkoxyFromPeroxy
$MOLECULE-AlphaHHydroPeroxylIsomerization

EOF
cat combine.lst
$COMBINE combine $MOLECULE-PrimaryCombined
