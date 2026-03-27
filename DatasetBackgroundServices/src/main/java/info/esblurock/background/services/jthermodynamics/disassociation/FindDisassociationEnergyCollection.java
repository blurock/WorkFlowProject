package info.esblurock.background.services.jthermodynamics.disassociation;

import java.util.ArrayList;

import org.dom4j.Document;

import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.structure.StructureAsCML;

public class FindDisassociationEnergyCollection {
    

	public static ArrayList<DisassociationEnergyWithAtomCounts> findDisassociationEnergy(String maintainer,
			String dataset) {
		ArrayList<DisassociationEnergyWithAtomCounts> energylist = new ArrayList<DisassociationEnergyWithAtomCounts>();
		String service = "ReadInDatasetWithDatasetCollectionLabel";
		String classname = "dataset:JThermodynamicsDisassociationEnergyOfStructure";
		JsonObject json = new JsonObject();
        JsonObject recordid = new JsonObject();
        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		/*
		json.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		json.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		*/
		json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
		json.addProperty(DatabaseServicesBase.service, service);
		JsonObject response = DatabaseServicesBase.process(json);
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonArray arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
			energylist = findDisassociationEnergy(arr);
		}
		return energylist;
	}
	
	public static JsonArray getTotalDisassociationEnergyCollection(Document document, String maintainer,
			String dataset) {
		JsonArray arr = null;
		String service = "ReadInDatasetWithDatasetCollectionLabel";
		String classname = "dataset:JThermodynamicsDisassociationEnergyOfStructure";
		JsonObject json = new JsonObject();
		JsonObject recordid = new JsonObject();
		json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
		recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
		json.addProperty(DatabaseServicesBase.service, service);
		JsonObject response = DatabaseServicesBase.process(json);
		MessageConstructor.combineBodyIntoDocument(document, response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
		} else {
		    MessageConstructor.isolateBody(document).addElement("div").addText("Error in reading dissassociation database, thus no elements in set");
		}
		return arr;
	}

	public static ArrayList<DisassociationEnergyWithAtomCounts> findDisassociationEnergy(JsonArray arr) {
		ArrayList<DisassociationEnergyWithAtomCounts> energylist = new ArrayList<DisassociationEnergyWithAtomCounts>();
		if (arr != null) {
			for (int i = 0; i < arr.size(); i++) {
				JsonObject energy = arr.get(i).getAsJsonObject();
					if (energy.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure) != null) {
					JsonObject structure = energy.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure)
							.getAsJsonObject();
					String cml = structure.get(ClassLabelConstants.JThermodynamicsStructureAsCMLString).getAsString();
					String name = structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
					StructureAsCML structascml = new StructureAsCML(name, cml);
					try {
						IAtomContainer molecule = structascml.getMolecule();
						JsonObject parameter = energy.get(ClassLabelConstants.JThermodynamicDisassociationEnergy)
								.getAsJsonObject();
						String valueS = parameter.get(ClassLabelConstants.ValueAsString).getAsString();
						String uncertaintyS = parameter.get(ClassLabelConstants.ValueUncertainty).getAsString();
						Double value = Double.valueOf(valueS);
						Double uncertainty = Double.valueOf(uncertaintyS);
						DisassociationEnergyWithAtomCounts disassociation = new DisassociationEnergyWithAtomCounts(
								molecule, name, value, uncertainty);
						energylist.add(disassociation);
					} catch (CDKException e) {

					}
				} else {

				}

			}
		}
		return energylist;
	}

}
