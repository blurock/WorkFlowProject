package info.esblurock.background.services.dataset;

import com.google.gson.JsonObject;

import info.esblurock.background.services.transaction.RunMultipleTransactions;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class ReadInStandardDatasets {
	
	public static void readInStandardDatasets() {
		
		String paths = 
/*				
				"/resources/standard/bensonrules/TransactionReadTableA1CarbonBensonSmallTest.json\n"
			    + "/resources/standard/bensonrules/TransactionParseTableA1CarbonBensonSmallTest.json\n"
				+ "/resources/standard/bensonrules/TransactionCreateTableA1CarbonBensonSmallTest.json\n"

				+ "/resources/standard/symmetry/external/TransactionReadExternalSymmetryCarbonAtomSmall.json\n"
				+"/resources/standard/symmetry/external/TransactionParseExternalSymmetryCarbonAtomSmall.json\n"
			    +"/resources/standard/symmetry/external/TransactionCreateExternalSymmetryCarbonAtomSmall.json\n"

				+"/resources/standard/bensonrules/TransactionReadTableA1CarbonBensonRules.json\n"
			    + "/resources/standard/bensonrules/TransactionParseTableA1CarbonBensonRules.json\n"
				+ "/resources/standard/bensonrules/TransactionCreateTableA1CarbonBensonRules.json\n"

				+"/resources/standard/metaatoms/TransactionReadBensonMetaAtom.json\n"
				+ "/resources/standard/metaatoms/TransactionParseBensonMetaAtom.json\n"
				+ "/resources/standard/metaatoms/TransactionCreateBensonMetaAtom.json\n"
				
				+"/resources/standard/symmetry/external/TransactionReadExternalSymmetryCarbonAtom.json\n"
				+"/resources/standard/symmetry/external/TransactionParseExternalSymmetryCarbonAtom.json\n"
			    +"/resources/standard/symmetry/external/TransactionCreateExternalSymmetryCarbonAtom.json\n"

				+"/resources/standard/disassociation/TransactionReadDisassociationAlkane.json\n"
				+ "/resources/standard/disassociation/TransactionParseDissassociationAlkane.json\n"
				+ "/resources/standard/disassociation/TransactionCreateDisassociationAlkane.json\n"
				
				+ "/resources/standard/hbi/burke/TransactionReadHBIBurke2015.json\n"
				+ "/resources/standard/hbi/burke/TransactionParseHBIBurke2015.json\n"
				+ "/resources/standard/hbi/burke/TransactionCreateHBIBurke2015.json\n"

				+ "/resources/standard/symmetry/internal/TransactionReadInternalSymmetryCarbonAtom.json\n"
				+ "/resources/standard/symmetry/internal/TransactionParseInternalSymmetryCarbonAtom.json\n"
				+ "/resources/standard/symmetry/internal/TransactionCreateInternalSymmetryCarbonAtom.json\n"

				+ "/resources/standard/symmetry/optical/TransactionReadOpticalSymmetry.json\n"
				+ "/resources/standard/symmetry/optical/TransactionParseOpticalSymmetry.json\n"
				+ "/resources/standard/symmetry/optical/TransactionCreateOpticalSymmetry.json\n"
				
				+ "/resources/standard/cycles/TransactionReadSubstructthermoCycles.json\n"
				+ "/resources/standard/cycles/TransactionParseSubstructthermoCycles.json\n"
				+ "/resources/standard/cycles/TransactionCreateSubstructthermoCycles.json\n"
				
				
				+ "/resources/standard/metaatoms/TransactionReadLinearMetaAtom.json\n"
				+ "/resources/standard/metaatoms/TransactionParseLinearMetaAtom.json\n"
				+ "/resources/standard/metaatoms/TransactionCreateLinearMetaAtom.json\n"
				
				+ "/resources/standard/bensonrules/TransactionReadTableA1CarbonOxygenBensonRules.json\n"
				+ "/resources/standard/bensonrules/TransactionParseTableA1CarbonOxygenBensonRules.json\n"
			    + "/resources/standard/bensonrules/TransactionCreateTableA1CarbonOxygenBensonRules.json\n"

				* "/resources/standard/bensonrules/TransactionReadTableA1NitrogenCHO.json\n"
				+ "/resources/standard/bensonrules/TransactionParseTableA1NitrogenCHO.json\n"
				+ "/resources/standard/bensonrules/TransactionCreateTableA1NitrogenCHO.json\n"

				+ "/resources/standard/bensonrules/TransactionReadTableA1HalogenCHO.json\n"
				+ "/resources/standard/bensonrules/TransactionParseTableA1HalogenCHO.json\n"
				+ "/resources/standard/bensonrules/TransactionCreateTableA1HalogenCHO.json\n"
				
				+ "/resources/standard/bensonrules/TransactionReadTableA1SulfurCHO.json\n"
				+ "/resources/standard/bensonrules/TransactionParseTableA1SulfurCHO.json\n"
				+ "/resources/standard/bensonrules/TransactionCreateTableA1SulfurCHO.json\n"

				+ "/resources/standard/bensonrules/TransactionReadTableA1Misc.json\n"
				+ "/resources/standard/bensonrules/TransactionParseTableA1Misc.json\n"
				+ "/resources/standard/bensonrules/TransactionCreateTableA1Misc.json\n"

				"/resources/standard/disassociation/TransactionReadDisassociationCHO.json\n"
				+ "/resources/standard/disassociation/TransactionParseDissassociationCHO.json\n"
				+ "/resources/standard/disassociation/TransactionCreateDisassociationCHO.json\n"

				+ "/resources/standard/disassociation/TransactionReadDisassociationHalogen.json\n"
				+ "/resources/standard/disassociation/TransactionParseDissassociationHalogen.json\n"
				+ "/resources/standard/disassociation/TransactionCreateDisassociationHalogen.json\n"

				+ "/resources/standard/disassociation/TransactionReadDisassociationNitrogen.json\n"
				+ "/resources/standard/disassociation/TransactionParseDissassociationNitrogen.json\n"
				+ "/resources/standard/disassociation/TransactionCreateDisassociationNitrogen.json\n"
				
				
				+ "/resources/standard/disassociation/TransactionReadDisassociationSulfur.json\n"
				+ "/resources/standard/disassociation/TransactionParseDisassociationSulfur.json\n"
				+ "/resources/standard/disassociation/TransactionCreateDisassociationSulfur.json\n"
				
				
				+ "/resources/standard/symmetry/secondary/TransactionReadSecondarySymmetryCarbonAtom.json\n"
				+ "/resources/standard/symmetry/secondary/TransactionParseSecondarySymmetryCarbonAtom.json\n"
				+ "/resources/standard/symmetry/secondary/TransactionCreateSecondarySymmetryCarbonAtom.json\n"
				*/							

				"/resources/standard/vibrational/TransactionReadVibrationalModes.json\n"
				+ "/resources/standard/vibrational/TransactionParseVibrationalModes.json\n"
				+ "/resources/standard/vibrational/TransactionCreateVibrationalModes.json\n"

;
		try {
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"UOqk0KtFtaXma5TGsi8Seh9RMbx1", true, false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
			System.out.println("Success!!!!");
		} else {
			System.out.println("Error: no reponse formed");
		}
		} catch(Exception ex) {
			ex.printStackTrace();
		}
	}

}
