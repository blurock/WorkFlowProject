#! /bin/tcsh -f

# submechanismsetup.sh pentane >! pentane.out
# submechanismsetup.sh hexane >! hexane.out
# submechanismsetup.sh heptane >! heptane.out
# submechanismsetup.sh octane >! octane.out

# molcombine.sh pentane >! pentane-combine.out
# molcombine.sh hexane  >! hexane-combine.out
# molcombine.sh heptane >! heptane-combine.out
# molcombine.sh octane  >! octane-combine.out


cat <<EOF >! combine.lst
pentane-BetaHPeroxyToOlefin
pentane-AlkoxyFromPeroxy
pentane-BasicLowTemp
pentane-OlefinCarbonylFromPeroxy
pentane-AlkeneFromRadical
pentane-CyclicEtherFromQOOH
pentane-ROOHFromPeroxylRadical
pentane-PeroxyFromHydrogenPeroxide
pentane-AlkoxyFromPeroxy
pentane-AlphaHHydroPeroxylIsomerization
hexane-BetaHPeroxyToOlefin
hexane-AlkoxyFromPeroxy
hexane-BasicLowTemp
hexane-OlefinCarbonylFromPeroxy
hexane-AlkeneFromRadical
hexane-CyclicEtherFromQOOH
hexane-ROOHFromPeroxylRadical
hexane-PeroxyFromHydrogenPeroxide
hexane-AlkoxyFromPeroxy
hexane-AlphaHHydroPeroxylIsomerization
heptane-BetaHPeroxyToOlefin
heptane-AlkoxyFromPeroxy
heptane-BasicLowTemp
heptane-OlefinCarbonylFromPeroxy
heptane-AlkeneFromRadical
heptane-CyclicEtherFromQOOH
heptane-ROOHFromPeroxylRadical
heptane-PeroxyFromHydrogenPeroxide
heptane-AlkoxyFromPeroxy
heptane-AlphaHHydroPeroxylIsomerization
octane-BetaHPeroxyToOlefin
octane-AlkoxyFromPeroxy
octane-BasicLowTemp
octane-OlefinCarbonylFromPeroxy
octane-AlkeneFromRadical
octane-CyclicEtherFromQOOH
octane-ROOHFromPeroxylRadical
octane-PeroxyFromHydrogenPeroxide
octane-AlkoxyFromPeroxy
octane-AlphaHHydroPeroxylIsomerization
EOF

combinemech.sh combine C8-Combined >! C8-Combined.out
printoutmech.sh C8-Combined C8-Combined
