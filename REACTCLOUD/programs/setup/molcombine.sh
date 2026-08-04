#! /bin/tcsh -f



if ( $#argv != 1 ) then
  echo "Usage: molcombine.sh Molecule"
  echo "        File     :    The seed molecule for the set of submechanisms"
  exit(1)
endif


set MOLECULE = $1

cat <<EOF >! combine.lst
$MOLECULE-BetaHPeroxyToOlefin
$MOLECULE-AlkoxyFromPeroxy
$MOLECULE-BasicLowTemp
$MOLECULE-OlefinCarbonylFromPeroxy
$MOLECULE-AlkeneFromRadical
$MOLECULE-CyclicEtherFromQOOH
$MOLECULE-ROOHFromPeroxylRadical
$MOLECULE-PeroxyFromHydrogenPeroxide
$MOLECULE-AlkoxyFromPeroxy
$MOLECULE-AlphaHHydroPeroxylIsomerization
EOF

combinemech.sh combine $MOLECULE-PrimaryCombined
