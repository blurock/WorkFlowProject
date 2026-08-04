cat <<EOF > test.prg
Read data/mechanisms/generated/PentaneClass.inp data/mechanisms/generated/Pentane.inp 0 
RunAlgorithm InputGenerated 0 
Read data/mechs/chemkin/LLNLBaseSetupClass.inp data/mechs/chemkin/LLNLBaseSetup.inp 0 
RunAlgorithm ReadChemkinAlg 0 
Read data/mechanisms/generated/PentaneAltNamesClass.inp data/mechanisms/generated/PentaneAltNames.inp 0 
Read data/PrintCombinedMechanismClass.inp data/PrintCombinedMechanism.inp 0 
RunAlgorithm BuildMechanism 0 
RunAlgorithm PrintMechStandardShortWithReverse 0 
END
EOF
killall -9 Reaction-trial.exe
/opt/ReactUsers/users/trial/bin/Reaction-trial.exe xxx Experiment reaction 1 < test.prg >& test.out

