COMMAND CreateOpenClose OPENCLOSECREATEDATABASE
     TITLE Initialize Database
     ARGUMENTS
          INPUT_FILE_NAME  DBDirectory
               TITLE   The Directory of the Databases
               DEFAULT_STRING DBDIRECTORY
          INT_VALUE   KeyRead
               TITLE   1 - Initialize Keys from database 0- don't
               DEFAULT 1
     END_ARGUMENTS
     COMMAND Start STARTDATABASE
          TITLE Opens and initializes all databases
          FUNCTION InitializeAllDatabases
     ENDCOMMAND
     COMMAND Initialize INITIALIZEDATABASE
          FUNCTION InitializeChemDBInfo
          TITLE Initializes chemical database information
     ENDCOMMAND
     COMMAND CreateTotal CREATETOTALDATABASE
          FUNCTION CreateChemDBFiles
          TITLE Creates all the chemical databases
     ENDCOMMAND
     COMMAND OpenTotal OPENTOTALDATABASE
          FUNCTION OpenChemDBFiles
          TITLE Opens all the chemical databases
     ENDCOMMAND
     COMMAND CloseTotal CLOSETOTALDATABASE
          FUNCTION CloseChemDBFiles
          TITLE Closes all the chemical databases
     ENDCOMMAND
ENDCOMMAND
DONE
