COMMAND Rxn RXNCOMMAND
   TITLE Reaction Set Managing
   ARGUMENTS
       INT_VALUE           ReadRxnDebug
            TITLE   The Debug Flag
            DEFAULT   0
            LOWER     0
       INT_VALUE        ASCIIReactionMaxNum   
            TITLE   The Debug Flag
            DEFAULT   100
            LOWER     10
       INPUT_FILE_NAME     RootRxnName
            TITLE   The Root Name for the reactions
            DEFAULT_STRING MASTER
       INPUT_FILE_NAME        RxnDirectory
            TITLE   The Directory of the reactions
            DEFAULT_STRING RXNDIR
       INPUT_FILE_NAME     RxnOutName
            TITLE   The Root Name for output
            DEFAULT_STRING MASTER
       INPUT_FILE_NAME        RxnOutDir
            TITLE   The Directory for output
            DEFAULT_STRING CURRENT
   END_ARGUMENTS
   COMMAND Read READRXN
         TITLE Read in Reaction Set


        COMMAND Reactions REACTIONSREAD
        TITLE Read in Reactions to Current Set
          COMMAND MolFiles MOLFILES
               TITLE Read in MolFiles from list of molfiles
               FUNCTION ReadInReactionsFromList
          ENDCOMMAND
          COMMAND ASCII MOLFILES
               TITLE Read in Reactions as lines
               FUNCTION ReadInASCIISetOfReactions
          ENDCOMMAND
          COMMAND FormatCheck RXNFORMATCHECK
               TITLE Check format of reaction input
               FUNCTION FormatCheckReactions
          ENDCOMMAND
          COMMAND ExistenceCheck RXNEXISTENCECHECK
               TITLE Check existence of reactions in database
               FUNCTION ExistenceCheckReactions
          ENDCOMMAND
          COMMAND Store RXNSTORE
               TITLE Store reactions in database
               FUNCTION StoreReactions
          ENDCOMMAND
        ENDCOMMAND

        COMMAND RxnPatterns REACTIONPATSREAD
        TITLE Read in Reactions to Current Set
          COMMAND MolFiles PATSMOLFILES
               TITLE Read in MolFiles from list of molfiles
               FUNCTION ReadInRxnPatternsFromList
          ENDCOMMAND
          COMMAND ASCII MOLFILESASCIIPATS
               TITLE Read in Reactions as lines
               FUNCTION ReadInASCIISetOfRxnPatterns
          ENDCOMMAND
          COMMAND FormatCheck RXNPATFORMATCHECK
               TITLE Check format of reaction pattern input
               FUNCTION FormatCheckRxnPatterns
          ENDCOMMAND
          COMMAND ExistenceCheck RXNPATEXISTENCECHECK
               TITLE Check existence of reaction patterns in database
               FUNCTION ExistenceCheckRxnPatterns
          ENDCOMMAND
          COMMAND Store RXNPATSTORE
               TITLE Store reaction patterns in database
               FUNCTION StoreRxnPatterns
          ENDCOMMAND
        ENDCOMMAND


     ENDCOMMAND

     COMMAND Output RXNOUTPUT
          TITLE Output the Reaction Information
          ARGUMENTS
            INPUT_FILE_NAME     RxnOutName
                TITLE   The Root Name for the reaction
                DEFAULT_STRING MASTER
            INPUT_FILE_NAME        RxnOutDir
                TITLE   The Directory of the Reactions
                DEFAULT_STRING CURRENT
          END_ARGUMENTS
        COMMAND Reactions REACTIONSPRINT
        TITLE Print Out Current Set Reactions
          COMMAND Print RXNPRINT
              TITLE Print out the current set of reactions
              FUNCTION MasterPrintReactionSet
          ENDCOMMAND
        ENDCOMMAND

        COMMAND RxnPatterns REACTIONPATTERNSPRINT
        TITLE Print Out Current Set Reaction Patterns
          COMMAND Print RXNPRINT
              TITLE Print out the current set of reactions
              FUNCTION MasterPrintRxnPatterns
          ENDCOMMAND
          COMMAND CheckDatabase RXNPATCHECKDB
              TITLE Check current set of reaction patterns in database
              FUNCTION MasterRxnPatternSetInDatabase
          ENDCOMMAND
        ENDCOMMAND
     ENDCOMMAND
     COMMAND Calc RXNPATTERNS
          TITLE Calcualations and Manipulations on Reaction Set
          COMMAND RxnPat CALCRXNPATTERN
               TITLE Calculate Rxn Pattern From Reaction Set
               FUNCTION FindReactionPattern
          ENDCOMMAND
          COMMAND Canonical RXNCANONICALORDER
               TITLE Put Reactions in Canonical Order
               FUNCTION MasterReactionOrder
          ENDCOMMAND
     ENDCOMMAND
     COMMAND Reactions DIRECTREACTIONS
     TITLE Manage Reactions
          COMMAND FormatCheck RXNDIRECTFORMATCHECK
               TITLE Check format of reaction input
               FUNCTION FormatCheckReactions
          ENDCOMMAND
          COMMAND ExistenceCheck RXNDIRECTEXISTENCECHECK
               TITLE Check existence of reactions in database
               FUNCTION ExistenceCheckReactions
          ENDCOMMAND
          COMMAND Store RXNDIRECTSTORE
               TITLE Store reactions in database
               FUNCTION StoreReactions
          ENDCOMMAND
     ENDCOMMAND

     COMMAND RxnPatterns DIRECTRXNPATTERNS
     TITLE Manage Reaction Patterns
          COMMAND FormatCheck RXNPATDIRECTFORMATCHECK
               TITLE Check format of reaction pattern input
               FUNCTION FormatCheckRxnPatterns
          ENDCOMMAND
          COMMAND ExistenceCheck RXNPATDIRECTEXISTENCECHECK
               TITLE Check existence of reaction patterns in database
               FUNCTION ExistenceCheckRxnPatterns
          ENDCOMMAND
          COMMAND Store RXNPATDIRECTSTORE
               TITLE Store reaction patterns in database
               FUNCTION StoreRxnPatterns
          ENDCOMMAND
     ENDCOMMAND

     COMMAND Settings RXNSETTINGS
          TITLE Set Various Global Reaction Parameters
         ARGUMENTS
             INT_VALUE MaxNumRxns
             DEFAULT     500
             LOWER       0
         END_ARGUMENTS
      ENDCOMMAND    
ENDCOMMAND
DONE

