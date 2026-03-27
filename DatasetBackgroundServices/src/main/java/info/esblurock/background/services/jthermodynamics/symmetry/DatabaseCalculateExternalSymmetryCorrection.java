package info.esblurock.background.services.jthermodynamics.symmetry;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.parameters.ParameterUtilities;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import thermo.data.benson.BensonThermodynamicBase;
import thermo.data.benson.SetOfBensonThermodynamicBase;
import thermo.data.structure.structure.symmetry.CalculateExternalSymmetryCorrection;
import thermo.data.structure.structure.symmetry.SetOfSymmetryDefinitions;
import thermo.data.structure.structure.symmetry.SymmetryDefinition;
import thermo.exception.ThermodynamicException;

/**
 * @author edwardblurock
 * 
 * This class is built upon CalculateExternalSymmetryCorrection which does the actual calculating
 * This class is based on using the (Google) Firestore Dataset for the source of 
 * SymmetryDefinitions (both primary and secondary)
 * 
 * It is based on the same principle as the SQLCalculateExternalSymmetryCorrection,
 * trying to decouple the database access with the calculation.
 * 
 *
 */
public class DatabaseCalculateExternalSymmetryCorrection extends CalculateExternalSymmetryCorrection {
	JsonArray symmarr;
	JsonArray symmarr2nd;
	
	JsonObject responseExternalSymmetryRead;
	JsonObject responseSecondarySymmetryRead;
	
	/**
	 * @param maintainer The maintainer of the dataset
	 * @param dataset The dataset name
	 * 
	 * This primarily sets up the primary and secondary SetOfSymmetryDefinitions
	 * 
	 */
	public DatabaseCalculateExternalSymmetryCorrection(String maintainer, String dataset) {
		symmarr = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSymmetryDefinitions(maintainer, dataset, 
				"dataset:StructureExternalSymmetry");
		responseExternalSymmetryRead = ExtractSetOfSymmetryDefinitionsFromDataset.getReadSymmetryResponse();
		symmarr2nd = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSymmetryDefinitions(maintainer, dataset, 
				"dataset:StructureSecondarySymmetry");
		responseSecondarySymmetryRead = ExtractSetOfSymmetryDefinitionsFromDataset.getReadSymmetryResponse();
		SetOfSymmetryDefinitions setOfDefinitions = ExtractSetOfSymmetryDefinitionsFromDataset.extract(symmarr);
		SetOfSymmetryDefinitions secondaryDefinitions = ExtractSetOfSymmetryDefinitionsFromDataset.extract(symmarr2nd);
		this.setSetOfDefinitions(setOfDefinitions);
		this.setSecondaryDefinitions(secondaryDefinitions);
		this.initialize();
	}
	
	public Document getReadResponseMessages() {
	    Document document = MessageConstructor.startDocument("Read in External Symmetry Elements");
	    MessageConstructor.isolateBody(document).addElement("hr");
        String externalmessage = responseExternalSymmetryRead.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
        MessageConstructor.combineBodyIntoDocument(document, externalmessage );
        MessageConstructor.isolateBody(document).addElement("hr");
        String secondarymessage = responseSecondarySymmetryRead.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
        MessageConstructor.combineBodyIntoDocument(document,secondarymessage);
        MessageConstructor.isolateBody(document).addElement("hr");
        return document;
	}
	
	/**
	 * @param molecule The molecule to add
	 * @param body The body of the total response document
	 * @param info Input info - used to get the units of the entropy term created.
	 * @return response with the entropy contribution as a ThermodynamicContributions object
	 * 
	 * This essentially does a call to CalculateExternalSymmetryCorrection.calculate(molecule,corrections).
	 * The contribution is created with ComputeThermodynamicsSymmetryContribution.parameterWithEntropy
	 * 
	 * Since a reference to the original SymmetryDefinition (from Firestore dataset), the name is 
	 * retrieved from the SymmetryDefinition (from Jthermodynamic). Note that this assumes only one
	 * symmetry contribution.
	 * 
	 * The units of the entropy are the default of the JThermodynamics system.
	 * 
	 */
	public JsonArray compute(IAtomContainer molecule, Element body, JsonObject info) {
		SetOfBensonThermodynamicBase corrections = new SetOfBensonThermodynamicBase();
		boolean symmetryfactor;
		JsonArray contributions = new JsonArray();
		try {
			symmetryfactor = calculate(molecule, corrections);
			if(symmetryfactor) {
				BensonThermodynamicBase thermo = corrections.get(0);
				Double entropy = this.getExternalSymmetryValue();
				SymmetryDefinition symdef = getSymmetryDefinition();
				String symname = symdef.getElementName();
				
				body.addElement("div").addText("External Symmetry Found  :" + symname);
				body.addElement("div").addText("External Symmetry        : " + symdef.getInternalSymmetryFactor());
				body.addElement("div").addText("Entropy Contribution     : " + entropy);
				
				JsonObject symdefjson = ComputeThermodynamicsSymmetryContribution.findSymmetryObjectInSet(getStructureExternalSymmetry(),symname);
				
				JsonObject contribution = ParameterUtilities.parameterWithEntropy(entropy,thermo.getName(),info);
				contribution.add(ClassLabelConstants.ChemConnectThermodynamicsDatabase,symdefjson);
				contributions.add(contribution);
				
			} else {
			    body.addElement("div").addText("No external energy contribution found");
			}
		} catch (ThermodynamicException e) {
		    body.addElement("div").addText("Error in calculating external symmetry");
		    body.addElement("div").addElement(e.getMessage());
		}
		return contributions;
	}
	
	
	JsonArray getStructureExternalSymmetry() {
		return symmarr;
	}
	
	JsonArray getStructureSecondarySymmetry() {
		return symmarr2nd;
	}

}
