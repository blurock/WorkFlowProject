COMMAND Tables MOLPROPTABLES
     TITLE Management of Property Tables
          ARGUMENTS
               INPUT_FILE_NAME  TablesDataDirectory
                    TITLE   The Directory of the Databases
                    DEFAULT_STRING TABLEDIR
               INPUT_FILE_NAME  TablesOutputDirectory
                    TITLE   The Directory of the Databases
                    DEFAULT_STRING CURRENT
          END_ARGUMENTS
          COMMAND Chemkin CHEMKINTABLES
               TITLE Chemkin Thermodynamic Database
               ARGUMENTS
                    INPUT_FILE_NAME  TablesDataChemkinRoot
                         TITLE   The Root name of the Chemkin Tables
                         DEFAULT_STRING NasaPolynomials
                    INT_VALUE ChemkinMaxMolecules
                         TITLE   The maximum number of molecules read in
                         DEFAULT 1000
               END_ARGUMENTS
                    COMMAND Read CHEMKINREADTHERMO
                         TITLE Read the Chemkin File
                         FUNCTION ReadInChemkinThermoFile
                    ENDCOMMAND
                    COMMAND PrintStandard CHEMKINPRINTSTANDARD
                         TITLE Print Chemkin Thermo Table in Standard Form
                         FUNCTION ChemkinThermPrintOutStandard
                    ENDCOMMAND
          ENDCOMMAND
          COMMAND Benson BENSONTABLES
               TITLE Benson Thermodynamic Calculations
               ARGUMENTS
                   INPUT_FILE_NAME  TablesDataBensonRoot
                       TITLE   The Root name of the Benson Tables
                       DEFAULT_STRING MASTER
                   INPUT_FILE_NAME  TranslationDataBensonRoot
                       TITLE   The Root name of the Benson Tables
                       DEFAULT_STRING BENSONROOT
               END_ARGUMENTS
            COMMAND AtomTranslation ATOMTRANSLATIONTABLES
               TITLE The atom translation tables for benson tables
               ARGUMENTS
                   INPUT_FILE_NAME  TranslationDataBensonRoot
                       TITLE   The Root name of the Benson Tables
                       DEFAULT_STRING MASTER
               END_ARGUMENTS
               COMMAND Read READATOMTRANSLATION
                    TITLE Read in the Atom Translation tables
                    FUNCTION ReadInBensonTranslationTables
               ENDCOMMAND
               COMMAND Print PRINTATOMTRANSLATION
                    TITLE Print out atom Translation Tables
                    FUNCTION PrintBensonAtomTranslation
               ENDCOMMAND
           ENDCOMMAND
           COMMAND BensonTables BENSONTHERMOTABLES
               TITLE The Benson Thermodynamic Tables
               COMMAND Read READBENSONTABLE
                    TITLE Read in One Benson Table
                    FUNCTION BindReadIn2ndOrdBensonTable
               ENDCOMMAND
               COMMAND Print PRINTBENSONTABLES
                    TITLE Print out Benson Tables
                    FUNCTION PrintOutBensonTables
               ENDCOMMAND
           ENDCOMMAND
           COMMAND BensonTrees BENSONTHERMOTREES
               TITLE The reorganization the Benson Tables
               COMMAND Organize ORGANIZEBENSON
                    TITLE Create and Organize Benson Search Tree from tables
                    FUNCTION SetUpSecondOrderTable
               ENDCOMMAND
               COMMAND Print PRINTBENSONTREE
                    TITLE Print Benson Search Tree
                    FUNCTION PrintOut2ndOrderBensonTree
               ENDCOMMAND
           ENDCOMMAND
        ENDCOMMAND
ENDCOMMAND
DONE

