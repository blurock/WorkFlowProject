COMMAND Mol MOLECULE
     TITLE Molecule Set Commands
       ARGUMENTS
          INT_VALUE           ReadMolDebug
                  TITLE   The Debug Flag
                  DEFAULT   0
                  LOWER     0
          INPUT_FILE_NAME     RootMolName
                  TITLE   The Root Name for the molecules
                  DEFAULT_STRING MASTER
          INPUT_FILE_NAME        MolDirectory
                  TITLE   The Directory of the molecules
                  DEFAULT_STRING MOLDIR
          INPUT_FILE_NAME     MolOutName
                  TITLE   The Root Name for the molecules
                  DEFAULT_STRING MASTER
          INPUT_FILE_NAME        MolOutDir
                  TITLE   The Directory of the molecules
                  DEFAULT_STRING CURRENT
          INT_VALUE    ASCIIMoleculeMaxNum       
                  TITLE   The Maximum number of molecules on input (used in allocations)
                  DEFAULT 500
       END_ARGUMENTS

     COMMAND MetaAtoms METAATOMCOMMANDS
          TITLE Functions for Meta Atoms
          COMMAND Read MOLMETAATOMSREAD
               TITLE Read in the set of Master Meta Atoms
               FUNCTION ReadMolFileMetaAtoms
          ENDCOMMAND
          COMMAND Print MOLMETAATOMPRINT
               TITLE Print in the set of Master Meta Atoms
               FUNCTION MasterPrintMetaAtoms
          ENDCOMMAND
     ENDCOMMAND
     COMMAND Calculations  CALCULATIONS
          TITLE Molecular Calculations on the molecule set
        COMMAND Molecules READCURRENTMOLECULES
          TITLE Calculations for Current Molecules
             COMMAND SemiEmpirical SEMIEMP
                  TITLE SemiEmpirical Calculations...Sello
                  FUNCTION ComputeElectronicPropsMolecules
             ENDCOMMAND
        ENDCOMMAND
        COMMAND SubStructures READCURRENTSUBSTRUCTURES
          TITLE Calculations for Current Substructures
             COMMAND SemiEmpirical SEMIEMP
                  TITLE SemiEmpirical Calculations...Sello
                  FUNCTION ComputeElectronicPropsSubStructures
             ENDCOMMAND
        ENDCOMMAND
     ENDCOMMAND
     COMMAND Graph GRAPH
          TITLE Molecular Subgraphs
          ARGUMENTS
             INPUT_FILE_NAME     SubGraphPatList
                  TITLE   The Root Name for the list of molecule patterns
                  DEFAULT_STRING MASTER
             INPUT_FILE_NAME     SubGraphMainList
                  TITLE   The Root Name for the list of molecules
                  DEFAULT_STRING MASTER
             INPUT_FILE_NAME        MolDirectory
                  TITLE   The Directory of the molecules
                  DEFAULT_STRING MOLDIR
          END_ARGUMENTS
          COMMAND PrintGraph PRINTGRAPH
               TITLE Print Molecules as Graphs
               FUNCTION PrintMoleculeAsGraph
          ENDCOMMAND
          COMMAND SubGraphs SUBGRAPH
               TITLE Matrix of SubGraphs
               FUNCTION SetOfSubGraphs
          ENDCOMMAND
     ENDCOMMAND

     COMMAND Read READMOLECULE
          TITLE Read in Molecule Information
        COMMAND Molecules READCURRENTMOLECULES
          TITLE Reading Current Molecules
          COMMAND MolFiles MOLFILES
               TITLE Read in MolFiles from list of molfiles
               FUNCTION AddToCurrentMolecules
          ENDCOMMAND
          COMMAND SDF      SDFMOLECULES
               TITLE Read in a set of molecules in SDF form (i.e. from ChemBase)
               FUNCTION AddSDFToCurrentMolecules
          ENDCOMMAND
          COMMAND ASCIIProps      ASCIIPROPS
               TITLE Read in a set of molecule properties in ASCII
               FUNCTION LocalReadASCIIMoleculeProps
          ENDCOMMAND
        ENDCOMMAND
        COMMAND SubStructures READCURRENTSUBSTRUCTURES
          TITLE Reading Current Substructures 
          COMMAND MolFiles MOLFILES
               TITLE Read in MolFiles from list of molfiles
               FUNCTION AddToCurrentSubStructures
          ENDCOMMAND
          COMMAND SDF      SDFSUBSTRUCTURES
               TITLE Read in a set of molecules in SDF form (i.e. from ChemBase)
               FUNCTION AddSDFToCurrentSubStructures
          ENDCOMMAND
        ENDCOMMAND
     ENDCOMMAND
     COMMAND Output MOLOUTPUT
          TITLE Output the Molecular Information
        COMMAND Molecules READCURRENTMOLECULES
          TITLE Printing Current Molecules
          COMMAND Print MOLPRINT
              TITLE Print out the current set of molecules
              FUNCTION MasterPrintCurrentMolecules
          ENDCOMMAND
        ENDCOMMAND
        COMMAND SubStructures READCURRENTSUBSTRUCTURES
          TITLE Printing Current SubStructures
          COMMAND Print MOLPRINT
              TITLE Print out the current set of substructures
              FUNCTION MasterPrintCurrentSubStructures
          ENDCOMMAND
        ENDCOMMAND
     ENDCOMMAND
ENDCOMMAND
DONE

