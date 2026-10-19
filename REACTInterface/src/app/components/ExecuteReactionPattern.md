*** Goal
'Test Reaction Pattern' will allow user to execute a reaction pattern 

*** Inputs
1. From the list of reaction patterns classes, select the reaction pattern class to execute. The patterns are listed individually. 
2. In a ketcher window, draw the main molecule to execute the reaction pattern with. 
3. The list of auxillary (small ) molecules needed to execute the reaction pattern. 

*** Reaction Pattern Selection
The reaction patterns are selected from a pop up window. The list of reaction patterns is the tree of reaction patterns and reaction pattern classes. After each element there is a check box. The user can check individual reactions or a reaction class. If a reaction class is checked, all reactions in that class will be checked. The list will be scrollable.

*** Auxilliary Molecules
The user will provide a list of small molecules needed to execute the reaction pattern. These will be presented in a scrollable list (similar to the reaction pattern list). Each molecule will have a check box. There will be a search field to help isolate the molecules.


Look at 'Execution' to see how this information is used.

*** lsr file: list of reaction patterns
From this information the input to the submechanism from Path 'lsr' file will be generated, for example as in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/data/mechs/submechanisms/Decomposition.lsr

The first line is the title
The second line is a list of auxilliary (small molecules) as names from the database
The third line has two parts:
1. The list of reaction patterns separated by commas
2. The target molecule.

** Execution
The procedure will be exactly the same as generating a 'Submechanism from Path'. The only differences are:
1.  The 'Target Molecule' is the one drawn in the ketcher window 
2. The 'path' will be created with the list of selected reaction patterns (from class list).
3. The auxillary molecules will be read from the list of small molecules needed to execute the reaction pattern (drawn in the ketcher window).

How the input is used can be seen using /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/scripts/runchain.sh 
ROOTNAME: 'ReactionPatternTest' (this will be the root name of the generated lsr file).
MOLECULE: This will be 'Temporary' or the name of the molecule if it exists already followed by the auxilliary molecules, all molecules are separated by commas.
MECHNAME: 'TestMechanism'

*** The target molecule

The generation procedure requires that the target molecule be in the database. The drawn molecule is not necessarily in the database. This can be solved creating a molecule called 'Temporary' and storing it in the usual fashion. If the molecule is in the database, then the database name is used, otherwise the 'Temporary' name will be used. 

*** Output

The output is two files
1. The generated mechanism: /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/data/mechanisms/generated/butane-HAbstractionBySimpleRadical1.mech
2. The generated sdf file: /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/data/mechanisms/generated/butane-HAbstractionBySimpleRadical1.sdf

The output will be presented in several tables:
1. CLASSCOEFFICIENTS: This information will be presented with each line being reaction patterns
2. EQUIVALENT: This information will be presented with each line being reaction patterns.
3. Each REACTIONCLASS will be presented in its own box with the header "REACTIONCLASS [Name]" where "Name" is the name of the reaction class. (Initially close and opened with an eye icon). In the panel, each line will be a reaction. The first number is the symmetry multiplication. 






