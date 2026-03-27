package info.esblurock.background.services.jthermodynamics.symmetry;

import java.util.Iterator;

import org.dom4j.Element;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.parameters.ParameterUtilities;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.benson.BensonThermodynamicBase;
import thermo.data.benson.SetOfBensonThermodynamicBase;
import thermo.data.structure.structure.symmetry.CalculateExternalSymmetryCorrection;
import thermo.data.structure.structure.symmetry.CalculateInternalSymmetryCorrection;
import thermo.data.structure.structure.symmetry.SetOfSymmetryDefinitions;
import thermo.exception.ThermodynamicException;

public class DatabaseCalculateInternalSymmetryCorrection extends CalculateInternalSymmetryCorrection {
	JsonArray symmetryarr;
	
	JsonObject responseStructureInternalSymmetryRead;
	
	public DatabaseCalculateInternalSymmetryCorrection(String maintainer, String dataset,
			CalculateExternalSymmetryCorrection external) {
		super();
		symmetryarr = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSymmetryDefinitions(maintainer, dataset, 
				"dataset:StructureInternalSymmetry");
		responseStructureInternalSymmetryRead = ExtractSetOfSymmetryDefinitionsFromDataset.getReadSymmetryResponse();
		SetOfSymmetryDefinitions setOfDefinitions = ExtractSetOfSymmetryDefinitionsFromDataset.extract(symmetryarr);
		this.setStructureInternalSymmetry(setOfDefinitions);
		this.setCalculateExternalSymmetryCorrection(external);
		this.initialize();
	}
	
	public JsonObject getResponseStructureInternalSymmetryRead() {
	    return responseStructureInternalSymmetryRead;
	}
	
	/**
	 * @param molecule The molecule to analyse
	 * @param body The body of the output response
	 * @param info Used for unit specifications
	 * @return The ThermodynamicContributions due to internal energy
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
			    String tablestyle = 
			            "  .tb { border-collapse: collapse; }\n"
			            + "  .tb th, .tb td { padding: 5px; border: solid 1px #777; }\n"
			            + "  .tb th { background-color: lightblue; }\n"
			            ;
			    body.addElement("style").addText(tablestyle);
				Element table = body.addElement("table");
				Element hrow =  table.addElement("tr");
				hrow.addElement("th").addText("Internal Symmetry Element");
				hrow.addElement("th").addText("Element Symmetry Factor");
				hrow.addElement("th").addText("Entropy");
				Iterator<BensonThermodynamicBase> iter = corrections.iterator();
				while(iter.hasNext()) {
					BensonThermodynamicBase benson = iter.next();
					double entropy = benson.getStandardEntropy298();
					JsonObject symmetry = findCorrectionInArray(benson);
					if(symmetry != null) {
					JsonObject def = symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
					String defname = def.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
					String symfactor = def.get(ClassLabelConstants.SymmetryFactorOfStructure).getAsString();
					Element row =  table.addElement("tr");
					row.addElement("td").addText(defname);
					row.addElement("td").addText(symfactor);
					row.addElement("td").addText(Double.toString(entropy));
					
					JsonObject contribution = ParameterUtilities.parameterWithEntropy(entropy,defname,info);
					contribution.add(ClassLabelConstants.ChemConnectThermodynamicsDatabase,symmetry);
					contributions.add(contribution);
					}
				}
			}
		} catch (ThermodynamicException e) {
		    body.addElement("div").addText("Error in computing Internal Symmetries");
		}
		return contributions;
	}
	
	/** Using the ID of BensonThermodynamicBase find corresponding Symmetry information
	 * 
	 * @param correction The 
	 * @return The JThermodynamicsSymmetryStructureDefinition
	 * 
	 * The ID of BensonThermodynamicBase has additional information attached. The name match
	 * is made with the first part (startsWith). An extra blank is needed to distinquish between
	 * symmetry definitions that begin with the same text.
	 * 
	 */
	JsonObject findCorrectionInArray(BensonThermodynamicBase correction) {
		boolean notfound = true;
		JsonObject internal = null;
		int index = correction.getID().indexOf(" ");
		String corrname = correction.getID();
		if(index > 0) {
		    corrname = correction.getID().substring(0,index);
		}
		for(int i=0; i<symmetryarr.size() && notfound;i++) {
			JsonObject symmetry = symmetryarr.get(i).getAsJsonObject();
			JsonObject def = symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
			String name = def.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
			
			if(corrname.equals(name)) {
				internal = symmetry;
				notfound = false;
			}
		}
		return internal;
	}

}
