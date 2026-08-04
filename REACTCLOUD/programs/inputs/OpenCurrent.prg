%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%  Read in Molecule Graph information in SDF form
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Mol
Parameters
RootMolName
Input
StandardMeta
Quit
Quit
MetaAtoms
Read
Quit
Quit

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Open up the data base
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
CreateOpenClose
Start
Quit

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% 
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
DbaseOps
Molecules
Misc
PrintList
Quit
Keys
Define
Read
Quit
Current
ReadInCurrent
Quit
Quit
Quit
Mol
Output
Molecules
Print
Quit
Quit
Quit
Tables
Benson
Parameters
TablesDataBensonRoot
Input
TableA.1
Quit
Quit
BensonTables
Read
Quit
BensonTrees
Print
Quit
Quit
Quit
Quit


Mol
Read
SDF
Quit
Calculations
SemiEmpirical
Quit
Quit
Tables
Benson
AtomTranslation
Parameters
TranslationDataBensonRoot
Input
standard
Quit
Quit
Read
Quit
Parameters
TablesDataBensonRoot
Input
table1a
Quit
Quit
BensonTables
Read
Quit
BensonTrees
Organize
Quit
Thermo
Calculate
Print
Quit
Quit
Quit
Mol
Output
Print
Quit
Quit
Quit


Quit






Mol
Read
SDF
Quit
Calculations
SemiEmpirical
Quit
Quit
DbaseOps
Molecules

Keys
Define
Quit

Current
Store
Quit

Keys
Fill
Write
Quit

Misc
PrintList
Quit
Quit
Quit
Quit
Quit

