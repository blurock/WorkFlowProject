COMMAND DbaseOps OPERATIONSDATABASE
     TITLE Operations with Database
          ARGUMENTS
               INPUT_FILE_NAME  DBDataDirectory
                    TITLE   The Directory of the Databases
                    DEFAULT_STRING DATA
                INT_VALUE    ASCIIMoleculeMaxNum       
                    TITLE   The Maximum number of molecules on input (used in allocations)
                    DEFAULT 500
             INPUT_FILE_NAME     RootRxnName
                  TITLE   The Root Name for the reactions
                  DEFAULT_STRING MASTER
                INPUT_FILE_NAME        RxnDirectory
                    TITLE   The Directory of the reactions
                    DEFAULT_STRING RXNDIR
          END_ARGUMENTS

          COMMAND Molecules DATABASEMOLECULE
               TITLE Molecule Database
                    ARGUMENTS
                         INPUT_FILE_NAME  MolDirectory
                              TITLE   The Root name of the molecule data
                              DEFAULT_STRING DATA
                         INPUT_FILE_NAME  DBDataMolRoot
                              TITLE   The Root name of the molecule data
                              DEFAULT_STRING MASTER
                    END_ARGUMENTS
              COMMAND MolFiles CHEMDBREADFROMFILES
                 TITLE Commands to put Molfiles direct in database
                    COMMAND InsertList MOLFROMLISTDATABASE
                         TITLE Insert list of molecule Molfiles
                         FUNCTION DBReadInMoleculesFromList
                    ENDCOMMAND
                    COMMAND InsertSDF MOLFROMSDFDATABASE
                         TITLE Insert SDF Molecules
                         FUNCTION DBReadSDFMolecules
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND StructureGenerate STRUCTUREGENERATE
                 TITLE Generate a structure under a given specification
                    ARGUMENTS
                         INPUT_FILE_NAME  SpecificationRoot
                              TITLE   The Root name of the molecule data
                              DEFAULT_STRING MASTER
                         INPUT_FILE_NAME  SpecificationDirectory
                              TITLE   The Directory of the REACTION molecules
                              DEFAULT_STRING CURRENT
                         INT_VALUE    NumberOfMolecules
                              TITLE   The number of molecules to generate
                              DEFAULT 1
                    END_ARGUMENTS
                    COMMAND Read READSTRUCTUREGENERATE
                         TITLE Read in the generate specifications
                         FUNCTION GenerateStructureRead
                    ENDCOMMAND
                    COMMAND Print PRINTSTRUCTUREGENERATE
                         TITLE Print out the generate specifications
                         FUNCTION GenerateStructurePrint
                    ENDCOMMAND
                    COMMAND Fill FILLGENERATE
                         TITLE Fill the generate specifications with database information
                         FUNCTION GenerateStructureFill
                    ENDCOMMAND
                    COMMAND Single GENERATESINGLEMOLECULE
                         TITLE Generate a Single Molecule
                         FUNCTION GenerateSingleMolecule
                    ENDCOMMAND
                    COMMAND Set GENERATESINGLEMOLECULE
                         TITLE Generate a Set of Molecules
                         FUNCTION GenerateSetOfMolecules
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Keys MOLECULESEARCHKEYS
                 TITLE Commands for setting up search keys
                    COMMAND Define DEFINESEARCHKEYS
                         TITLE Define the standard molecule search keys
                         FUNCTION DBResetMoleculeSearchKeys
                    ENDCOMMAND
                    COMMAND Fill DBFILLSEARCHKEYS
                         TITLE Fill in the values of all the search keys
                         FUNCTION DBProduceMoleculeSearchKeys
                    ENDCOMMAND
                    COMMAND Write DBWRITEMOLSEARCHKEYS
                         TITLE Write Current Keys to database
                         FUNCTION WriteMoleculeDBKeys
                    ENDCOMMAND
                    COMMAND Read DBREADMOLSEARCHKEYS
                         TITLE Read Name and ID search keys
                         FUNCTION ReadMoleculeDBKeys
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Current DBREADMOLCURRENT
                 TITLE Current Molecules and Database                
                    COMMAND ReadInCurrent DBREADINCURRENT
                         TITLE Read in the current set of molecules
                         FUNCTION DBReadListOfMolecules
                    ENDCOMMAND
                    COMMAND Store DBMOLECULESTORE
                         TITLE Store the Current Molecules in database
                         FUNCTION StoreCurrentMoleculeSet
                    ENDCOMMAND
                    COMMAND ASCII MOLFROMSDFDATABASE
                         TITLE Insert ASCII data from a file
                         FUNCTION ReadInASCIISetOfMoleculeProps
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Misc DBMOLECULEGENERAL
                 TITLE Various Additional Commands
                    ARGUMENTS
                         INPUT_FILE_NAME  DBDataMolRoot
                              TITLE   The Root name of the molecule data
                              DEFAULT_STRING MASTER
                         INPUT_FILE_NAME  ReactionMolDirectory
                              TITLE   The Directory of the REACTION molecules
                              DEFAULT_STRING .
                    END_ARGUMENTS
                    COMMAND PrintList PRINTMOLDATABASE
                         TITLE Print List of Molecules
                         FUNCTION DBPrintAllMolecules
                    ENDCOMMAND
                    COMMAND Export MOLFROMSDFDATABASE
                         TITLE Export Molecule Information to REACTION
                         FUNCTION ExportMolecules
                    ENDCOMMAND
              ENDCOMMAND
          ENDCOMMAND


          COMMAND SubStructures DATABASESUBSTRUCTURES
               TITLE SubStructure Databse
                    ARGUMENTS
                         INPUT_FILE_NAME  DBDataMolRoot
                              TITLE   The Root name of the molecule data
                              DEFAULT_STRING MOLECULE_ROOT
                    END_ARGUMENTS
              COMMAND MolFiles CHEMDBREADFROMFILESSUBS
                 TITLE Commands to put Molfiles direct in database
%%                    COMMAND InsertList SUBSFROMLISTDATABASE
%%                         TITLE Insert list of molecule Molfiles
%%                         FUNCTION DBReadInSubStructuresFromList
%%                    ENDCOMMAND
                    COMMAND InsertSDF SUBSFROMSDFDATABASE
                         TITLE Insert SDF Substructures
                         FUNCTION DBReadSDFSubstructures
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Keys SUBSTRUCTURESEARCHKEYS
                 TITLE Commands for setting up search keys
                    COMMAND Define DEFINESEARCHKEYS
                         TITLE Define the standard molecule search keys
                         FUNCTION DBResetSubstructureSearchKeys
                    ENDCOMMAND
                    COMMAND Fill DBFILLSEARCHKEYS
                         TITLE Fill in the values of all the search keys
                         FUNCTION DBProduceSubstructureSearchKeys
                    ENDCOMMAND
                    COMMAND Write DBWRITEMOLSEARCHKEYS
                         TITLE Write Current Keys to database
                         FUNCTION WriteSubStructureDBKeys
                    ENDCOMMAND
                    COMMAND Read DBREADMOLSEARCHKEYS
                         TITLE Read Name and ID search keys
                         FUNCTION ReadSubStructureDBKeys
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Current DBREADMOLCURRENT
                 TITLE Current Molecules and Database                
                    COMMAND ReadInCurrent DBREADINCURRENT
                         TITLE Read in the current set of molecules
                         FUNCTION DBReadListOfSubstructures
                    ENDCOMMAND
                    COMMAND Store DBSUBSTRUCTURESTORE
                         TITLE Store the Current Molecules in database
                         FUNCTION StoreCurrentSubStructureSet
                    ENDCOMMAND
                    COMMAND ASCII MOLFROMSDFDATABASE
                         TITLE Insert ASCII data from a file
                         FUNCTION ReadInASCIISetOfSubStructureProps
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Misc DBSUBSTRUCTUREGENERAL
                 TITLE Various Additional Commands
                    COMMAND PrintList PRINTMOLDATABASE
                         TITLE Print List of Molecules
                         FUNCTION DBPrintAllSubstructures
                    ENDCOMMAND
              ENDCOMMAND
          ENDCOMMAND


          COMMAND Reactions DATABASEREACTIONS
               TITLE Reaction Databsse
                    ARGUMENTS
                         INPUT_FILE_NAME  DBDataRxnRoot
                              TITLE   The Root name of the reaction data
                              DEFAULT_STRING REACTIONROOT
                    END_ARGUMENTS
              COMMAND Keys MOLECULESEARCHKEYS
                 TITLE Commands for setting up search keys
                    COMMAND Define DEFINESEARCHKEYS
                         TITLE Define the standard reaction search keys
                         FUNCTION DBResetReactionSearchKeys
                    ENDCOMMAND
                    COMMAND Fill DBFILLSEARCHKEYS
                         TITLE Fill in the values of all the search keys
                         FUNCTION DBProduceReactionSearchKeys
                    ENDCOMMAND
                    COMMAND Write DBWRITEMOLSEARCHKEYS
                         TITLE Write Current Keys to database
                         FUNCTION WriteReactionDBKeys
                    ENDCOMMAND
                    COMMAND Read DBREADMOLSEARCHKEYS
                         TITLE Read Name and ID search keys
                         FUNCTION ReadReactionDBKeys
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Current DBREADRXNCURRENT
                 TITLE Current Reaction and Database                
                    COMMAND ReadInCurrent DBREADINCURRENTRXN
                         TITLE Read in the current set of molecules
                         FUNCTION DBReadListOfReactions
                    ENDCOMMAND
                    COMMAND Store DBREACTIONSTORE
                         TITLE Store the Current Reactions in database
                         FUNCTION StoreCurrentReactions
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Misc DBSUBSTRUCTUREGENERAL
                 TITLE Various Additional Commands
                    COMMAND PrintList PRINTMOLDATABASE
                         TITLE Print List of Reactions
                         FUNCTION DBPrintAllReactions
                    ENDCOMMAND
              ENDCOMMAND
          ENDCOMMAND


          COMMAND RxnPatterns DATABASEREACTIONS
               TITLE Reaction Databsse
                    ARGUMENTS
                         INPUT_FILE_NAME  DBDataRxnRoot
                              TITLE   The Root name of the reaction data
                              DEFAULT_STRING REACTIONROOT
                    END_ARGUMENTS
              COMMAND Keys MOLECULESEARCHKEYS
                 TITLE Commands for setting up search keys
                    COMMAND Define DEFINESEARCHKEYS
                         TITLE Define the standard reaction search keys
                         FUNCTION DBResetRxnPatternSearchKeys
                    ENDCOMMAND
                    COMMAND Fill DBFILLSEARCHKEYS
                         TITLE Fill in the values of all the search keys
                         FUNCTION DBProduceRxnPatternSearchKeys
                    ENDCOMMAND
                    COMMAND Write DBWRITEMOLSEARCHKEYS
                         TITLE Write Current Keys to database
                         FUNCTION WriteRxnPatternDBKeys
                    ENDCOMMAND
                    COMMAND Read DBREADMOLSEARCHKEYS
                         TITLE Read Name and ID search keys
                         FUNCTION ReadRxnPatternDBKeys
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Current DBREADRXNCURRENT
                 TITLE Current Reaction and Database                
                    COMMAND ReadInCurrent DBREADINCURRENTRXN
                         TITLE Read in the current set of molecules
                         FUNCTION DBReadListOfRxnPatterns
                    ENDCOMMAND
                    COMMAND Store DBREACTIONSTORE
                         TITLE Store the Current Reactions in database
                         FUNCTION StoreCurrentReactionPatterns
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Misc DBSUBSTRUCTUREGENERAL
                 TITLE Various Additional Commands
                    COMMAND PrintList PRINTMOLDATABASE
                         TITLE Print List of Reactions
                         FUNCTION DBPrintAllRxnPatterns
                    ENDCOMMAND
              ENDCOMMAND
              COMMAND Read DBREACTIONSTORE
                    TITLE Read in RxnPatterns using Substructures in Database
                    FUNCTION ReadInRxnPatternsMolsFromDB
              ENDCOMMAND
          ENDCOMMAND

          COMMAND Benson DATABASEBENSON
               TITLE Benson Thermodynamic Tables
               ARGUMENTS
                   INPUT_FILE_NAME  TablesDataBensonRoot
                       TITLE   The Root name of the Benson Tables
                       DEFAULT_STRING BENSONROOT
                   INT_VALUE           MaxNumberOfTables
                       TITLE   The Maximum number of benson tables (used in allocation)
                       DEFAULT 30
               END_ARGUMENTS
               COMMAND Store BENSONTHERMOSTORE
                  TITLE Store the current set of thermo tables into database
                  FUNCTION StoreCurrentBensonTables
               ENDCOMMAND
               COMMAND Print BENSONTHERMOPRINT
                  TITLE Print list of thermo tables from database
                  FUNCTION PrintAllBensonTables
               ENDCOMMAND
               COMMAND ReadList BENSONTHERMOREADLIST
                  TITLE Read a list of tables from database into current
                  FUNCTION ReadBensonTablesFromList
               ENDCOMMAND
          ENDCOMMAND
          COMMAND BensonTree DATABASEBENSONTREE
               TITLE Benson Thermodynamic Tables as Tree
               ARGUMENTS
                   STRING_VALUE  BensonTreeName
                       TITLE   The stored name of the tree
                       DEFAULT_STRING BENSONTREEROOT
               END_ARGUMENTS
               COMMAND Store BENSONTHERMOTREESTORE
                  TITLE Store the current benson thermo tree
                  FUNCTION StoreCurrentBensonTree
               ENDCOMMAND
               COMMAND Print BENSONTHERMOTREEPRINT
                  TITLE Print list of thermo trees
                  FUNCTION PrintAllBensonTrees
               ENDCOMMAND
               COMMAND Read BENSONTHERMOTREEREAD
                  TITLE Read in the Benson Thermo Tree
                  FUNCTION DBReadInBensonTree
               ENDCOMMAND
          ENDCOMMAND
          COMMAND Chemkin DATABASECHEMKIN
               TITLE Chemkin Values
               ARGUMENTS
                    INPUT_FILE_NAME  ChemkinDirectory
                         TITLE   The Directory of the chemkin data
                         DEFAULT_STRING DATA
                    INPUT_FILE_NAME  RootChemkinName
                         TITLE   The Root name of the chemkin file
                         DEFAULT_STRING MASTER
                    INPUT_FILE_NAME  AlternativeName
                         TITLE   The Alternative Name to fetch
                         DEFAULT_STRING CHEMKIN
               END_ARGUMENTS
               COMMAND Store STORECHEMKINVALUES
                  TITLE Store the current chemkin values (replace)
                  FUNCTION StoreCurrentChemkin
               ENDCOMMAND
               COMMAND Fill  CHEMKINFILLVALUES
                  TITLE File in the values for the current molecules 
                  FUNCTION FillInChemkinInCurrent
               ENDCOMMAND
               COMMAND Print CHEMKINPRINTVALUES
                  TITLE Print list of chemkin values
                  FUNCTION PrintAllChemkinValues
               ENDCOMMAND
               COMMAND Correspondences CHEMKINPRINTVALUES
                  TITLE Print list of chemkin values
                  FUNCTION PrintChemkinNameCorrespondences
               ENDCOMMAND

          ENDCOMMAND
          COMMAND Mechanisms DATABASEMECHANISMS
               TITLE Mechanism Database
                    ARGUMENTS
                         INPUT_FILE_NAME  MechDirectory
                              TITLE   The Directory of the mechanism definitions
                              DEFAULT_STRING DATA
                         INPUT_FILE_NAME  RootMechName
                              TITLE   The Root name of the mechanism definition
                              DEFAULT_STRING MASTER
                         INT_VALUE           MechanismMaxNum
                              TITLE   The Maximum number of benson tables (used in allocation)
                              DEFAULT 30
                         INPUT_FILE_NAME     MechanismName
                              TITLE   The Name of the mechanism
                              DEFAULT_STRING MASTER
                    END_ARGUMENTS
               COMMAND Read READMECHANISMDETAILEDDEFINITION
                    TITLE Read Detailed Mechanism Definition
                    FUNCTION ReadInMechanism
               ENDCOMMAND
               COMMAND Store STOREMECHANISMDETAILED
                    TITLE Stored Detailed Mechanism 
                    FUNCTION StoreSetOfMechanismsInDatabase
               ENDCOMMAND
               COMMAND Print PRINTMECHANISMDETAILED
                    TITLE Print Detailed Mechanism
                    FUNCTION MasterPrintSetOfMechanisms
               ENDCOMMAND
               COMMAND Retrieve RETRIEVEMECHANISMDETAILED
                    TITLE Retrieve a set of Detailed Mechanisms
                    FUNCTION RetrieveMechanismsFromDatabase
               ENDCOMMAND
               COMMAND Combine RETRIEVEMECHANISMDETAILED
                    TITLE Combine Detailed Mechanisms
                    FUNCTION CombineToTotalMechanism
               ENDCOMMAND
               COMMAND Initialize RETRIEVEMECHANISMDETAILED
                    TITLE Initialize Detailed Mechanism Database
                    FUNCTION InitializeMechanismDataBase
               ENDCOMMAND
               COMMAND List RETRIEVEMECHANISMDETAILED
                    TITLE List Detailed Mechanisms in Database
                    FUNCTION DBPrintAllMechanisms
               ENDCOMMAND
          ENDCOMMAND

          COMMAND Chain GENERATECHAINDB
               TITLE Mechanisms Generated as Chains
                    ARGUMENTS
                         INPUT_FILE_NAME  MechDirectory
                              TITLE   The Directory of the mechanism definitions
                              DEFAULT_STRING DATA
                         INPUT_FILE_NAME  RootMechName
                              TITLE   The Root name of the mechanism definition
                              DEFAULT_STRING MASTER
                         INPUT_FILE_NAME  TransformRxn
                              TITLE   The Root name of the transform data
                              DEFAULT_STRING MASTER
                         INPUT_FILE_NAME  TransformDir
                              TITLE   The directory of the transform data
                              DEFAULT_STRING DATA
                         INPUT_FILE_NAME  InitialMolecules
                              TITLE   The set of initial molecules (separated by semi-colons)
                              DEFAULT_STRING MASTER
                    END_ARGUMENTS
                    COMMAND Generate GENERATECHAINMECHANISM
                         TITLE Generate the chain mechanism
                         FUNCTION GenerateChainMechanism
                    ENDCOMMAND
          ENDCOMMAND
ENDCOMMAND
DONE
