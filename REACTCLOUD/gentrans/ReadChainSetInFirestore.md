*** Goal
The goal of this task is to move the storage of ReadChainSet from a file to Firestore. Also, additional format checks and the existence of the molecules and reaction patterns will be done.

*** Commands

In the /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/command/chemdb/dboperations.cmd add the following commands under the 'COMMAND Chain GENERATECHAINDB' command:

1: ReadCheck: Read in a ReadChainSet, checking and formatting the contents of the file. In addition, after a sucessful read, check if all the molecules and the reaction patterns exist in the database.
2: ReadStore: Read in a ReadChainSet from a file and store it in Firestore.

*** ReadCheck

Using ReadInChainDefinition in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/gentrans as a template, create a program that will read in a ReadChainSet from a file and check if all the molecules and the reaction patterns exist in the database. If they do, then create a ReadChainSet in Firestore.

The molecules to be checked are in: 
Molecules (ReadInMoleculeSet) of the ReadChainSet which is collected in DetermineSetOfMolecules:
ExtraMolecules (ReadInMoleculeSet) of the ReadInReactionSet
AuxiliaryMolecules (ReadInMoleculeSet) of each step in the ReadChainSet

The existent of the reaction patterns to be checked by the string 'Name' stored in ReadInReaction in the ReadInReactionSet of 'Reactions' in ReadChainSet (collected in routine DetermineSetOfReactions).

*** FirestoreStorage

The ReadChainSet to be stored in Firestore is identified by a path of the format:
/users/<user>/databases/MechanismPathway

The name of the mechanism pathway is the "Name" field of the ReadChainSet.

There will be no classifications. The mechanism pathway is identified by the name. Equivalence is equivalent name. 

*** Usage in generating a mechanism

In GenerateChainMechanism in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/genrxn.c the ReadChainSet (readchain) instead of reading from a file as inv'ReadInChainDefinition' the source should be from the firestore object in /users/<user>/databases/MechanismPathway/<mechanism_pathway_name>. Where the name is given by the system variable 'TransformRxn'.


*** Interface for creating and modifying mechanism pathways

There should be two options in creating a mechanism pathway:
1. Read in from a file using the ReadCheck and ReadStore commands (this could be an addition to Read, Check Store to Database panel)
2. An interface for selecting molecules from the database and reaction patterns from the database and creating a ReadChainSet in Firestore.

*** Interface for the creation of ReadChainSets in Firestore.

1. Top panel with the mechanism pathway name
2. A panel to select auxiliary molecules
3. A panel to define the steps in the mechanism pathway. Each step will consist of a reaction pattern and a set of molecules.

Each mechanism step pathway should contain 
1. An interface to select a list of reaction patterns. It is important that one can select whole classes of reaction patterns.
2. An interface to select auxilary molecules for this step. 


