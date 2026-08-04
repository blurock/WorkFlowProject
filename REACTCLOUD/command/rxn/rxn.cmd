COMMAND Rxn RXNCOMMAND
   TITLE Reaction Set Managing
   COMMAND Read READRXN
         TITLE Read in Reaction Set
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
          END_ARGUMENTS

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
