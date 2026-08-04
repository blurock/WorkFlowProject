#!/bin/csh


cat <<EOF > run.prg
Read data/mechanisms/generated/ButaneClass.inp data/mechanisms/generated/Butane.inp 0
RunAlgorithm InputGenerated 0
Read data/mechs/chemkin/LLNLBaseSetupClass.inp data/mechs/chemkin/LLNLBaseSetup.inp 0
RunAlgorithm ReadChemkinAlg 0
RunAlgorithm ReadChemkinAlg 0
Print Instance
Read data/mechanisms/generated/ButaneClass.inp data/mechanisms/generated/Butane.inp 0 
RunAlgorithm BuildMechanism 0
EOF

/opt/ReactUsers/users/trial/bin/Reaction-trial.exe xxx Operate reaction 1 < run.prg
