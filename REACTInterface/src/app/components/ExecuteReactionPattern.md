*** Goal
'Run Reaction Pattern' will allow user to execute a reaction pattern 

*** Inputs
1. From the list of reaction patterns classes, select the reaction pattern class to execute
2. In a ketcher window, draw the main molecule to execute the reaction pattern with. 
3. The list of auxillary (small ) molecules needed to execute the reaction pattern. 

*** Procedure
The procedure will be exactly the same as generating a 'Submechanism from Path'. The only differences are:
1.  The 'Target Molecule' is the one drawn in the ketcher window 
2. The 'path' will be created with the list of selected reaction patterns (from class list).
3. The auxillary molecules will be read from the list of small molecules needed to execute the reaction pattern (drawn in the ketcher window).

From this information the input to the submechanism from Path 'lsr' file will be generated, for example as in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/data/mechs/submechanisms/Decomposition.lsr

How the input is used can be seen using /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/scripts/runchain.sh 

ROOTNAME: 'ReactionPatternTest' (this will be the root name of the generated lsr file).
MOLECULE: This will be 'Temporary' or the name of the molecule if it exists already followed by the auxilliary molecules, separated by commas.




The first line is the title
The second line is a list of auxilliary (small molecules) as names from the database
The third line has two parts:
1. The list of reaction patterns separated by commas
2. The target molecule.

*** The target molecule

The generation procedure requires that the target molecule be in the database. The drawn molecule is not necessarily in the database. This can be solved creating a molecule called 'Temporary' and storing it in the usual fashion. If the molecule is in the database, then the database name is used, otherwise the 'Temporary' name will be used. 



