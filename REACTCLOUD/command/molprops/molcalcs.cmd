COMMAND MolCalcs MOLCALCULATIONS
TITLE Molecular Property Calculations and Management
    COMMAND Thermo CALCULATETHERMOVALUES
          TITLE Calculation of Benson Thermodynamics for current molecules
          COMMAND Calculate BENSONCALCULATE
               TITLE Calculate Benson Quantities for Current Molecules
               FUNCTION CurrentMoleculeBensonThermo
          ENDCOMMAND
          COMMAND Print BENSONMOLVALUES
               TITLE Print Benson Quantities for Current Molecules
               FUNCTION PrintOutMolThermo
          ENDCOMMAND
          COMMAND Chemkin BENSONTOCHEMKIN
               TITLE Convert Benson Values to Chemkin Form
               FUNCTION ChemkinFromBensonCalc
          ENDCOMMAND
          COMMAND Test BENSONTOCHEMKIN
               TITLE Test Conversion
               FUNCTION ChemkinToBensonTest
          ENDCOMMAND
          COMMAND TransferChemkin BENSONTOCHEMKIN
               TITLE Transfer Chemkin Values from molecule to tables 
               FUNCTION TransferChemkinToTables
          ENDCOMMAND
    ENDCOMMAND
ENDCOMMAND
DONE
