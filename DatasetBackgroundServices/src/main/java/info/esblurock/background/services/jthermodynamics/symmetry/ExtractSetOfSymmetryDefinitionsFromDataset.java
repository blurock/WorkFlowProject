package info.esblurock.background.services.jthermodynamics.symmetry;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.openscience.cdk.exception.CDKException;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.structure.MetaAtomDefinition;
import thermo.data.structure.structure.MetaAtomInfo;
import thermo.data.structure.structure.StructureAsCML;
import thermo.data.structure.structure.symmetry.SetOfSymmetryDefinitions;
import thermo.data.structure.structure.symmetry.SymmetryDefinition;
import thermo.data.structure.structure.symmetry.SymmetryPair;

public class ExtractSetOfSymmetryDefinitionsFromDataset {
    
    static JsonObject response;

	/** Retrieve translated to SetOfSymmetryDefinitions from dataset
	 * 
	 * @param maintainer The maintainer of the dataset
	 * @param dataset The dataset
	 * @param symmetrytype The external symmetry type to retrieve.
	 * @return The SetOfSymmetryDefinitions translated from the JThermodynamicsSymmetryStructureDefinition
	 */
	public static SetOfSymmetryDefinitions extract(String maintainer, String dataset, String symmetrytype) {
		JsonArray definitions = databaseSymmetryDefinitions(maintainer,dataset,symmetrytype);
		SetOfSymmetryDefinitions setofsymmetries = new SetOfSymmetryDefinitions();
		for(int i=0;i<definitions.size();i++) {
			JsonObject symmetry = definitions.get(i).getAsJsonObject();
			SymmetryDefinition symmetrydefinition = convertToSymmetryDefinition(symmetry);
			if(symmetrydefinition != null) {
				setofsymmetries.add(symmetrydefinition);
			}
		}
		return setofsymmetries;
	}
	
	/** Translate a single JThermodynamicsSymmetryStructureDefinition to single SymmetryDefinition
	 * 
	 * @param symmetry The JThermodynamicsSymmetryStructureDefinition
	 * @return The translated SymmetryDefinition
	 * 
	 * 
	 */
	public static SymmetryDefinition convertToSymmetryDefinition(JsonObject symmetry) {
		SymmetryDefinition symmetrydefinition = null;
		JsonObject symmdef = symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
		String label = symmdef.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
		String type = symmdef.get(ClassLabelConstants.StructureSymmetryType).getAsString();
		String symmfactor = symmdef.get(ClassLabelConstants.SymmetryFactorOfStructure).getAsString();
		JsonArray nodegroups = symmdef.get(ClassLabelConstants.JThermodynamicsSymmetryNodeGroupDefinition).getAsJsonArray();
		List<SymmetryPair> pairs = new ArrayList<SymmetryPair>();
		for(int node=0;node<nodegroups.size();node++) {
			JsonObject nodegroup = nodegroups.get(node).getAsJsonObject();
			String nodelabel = nodegroup.get(ClassLabelConstants.JThermodynamicsSymmetryDefinitionNodeLabel).getAsString();
			String connectedsymmetry = nodegroup.get(ClassLabelConstants.JThermodynamicsSymmetryDefinitionNodeType).getAsString();
			String symmlabel = DatasetOntologyParseBase.getLabelFromAnnotation(connectedsymmetry);
			String groupname = nodegroup.get(ClassLabelConstants.JThermodynamicsSymmetryDefinitionSubGroupLabel).getAsString();
			SymmetryPair pair = new SymmetryPair(nodelabel,groupname,symmlabel);
			pairs.add(pair);
			}
		JsonObject structure = symmetry.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
		String cml = structure.get(ClassLabelConstants.JThermodynamicsStructureAsCMLString)
				.getAsString();
		String name = structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
		StructureAsCML structascml = new StructureAsCML(name, cml);
		MetaAtomInfo info = new MetaAtomInfo();
		info.setMetaAtomType(type);
		info.setMetaAtomName(label);
		info.setElementName(name);
		try {
			MetaAtomDefinition definition = new MetaAtomDefinition(info, structascml);
			Double symmfactorD = Double.parseDouble(symmfactor);
			symmetrydefinition = new SymmetryDefinition(definition, pairs,symmfactorD);
			
		} catch (ClassNotFoundException | CDKException | IOException e) {
			e.printStackTrace();
		}
		return symmetrydefinition;
	}
	
	/**
	 * @param definitions The set of JThermodynamicsSymmetryStructureDefinition as read in from the database
	 * @return The translated SetOfSymmetryDefinitions
	 * 
	 * repeated calls to convertToSymmetryDefinition
	 * 
	 */
	public static SetOfSymmetryDefinitions extract(JsonArray definitions) {
		SetOfSymmetryDefinitions setofsymmetries = new SetOfSymmetryDefinitions();
		if(definitions != null) {
		for(int i=0;i<definitions.size();i++) {
			JsonObject symmetry = definitions.get(i).getAsJsonObject();
			SymmetryDefinition symmetrydefinition = convertToSymmetryDefinition(symmetry);
			if(symmetrydefinition != null) {
				setofsymmetries.add(symmetrydefinition);
			}
		}
		} else {
		    
		}
		return setofsymmetries;
	}
	
	
	/**
	 * @param maintainer The maintainer of the database
	 * @param dataset The dataset
	 * @param symmetrytype The specific symmetry data type
	 * @return The set of JThermodynamicsSymmetryStructureDefinition as read in from the database
	 * 
	 * This sets up the SetOfPropertyValueQueryPairs to read in the JThermodynamicsSymmetryStructureDefinition from the
	 * database.
	 * The additional property is to specify the symmetry type in the position 
	 * 'dataset:symmetrydefinition.dataset:structuresymmetrytype'
	 * 
	 */
	public static JsonArray databaseSymmetryDefinitions(String maintainer, String dataset, String symmetrytype) {
		JsonArray definitions = null;
		response = null;
        String classname = "dataset:JThermodynamicsSymmetryStructureDefinition";
		String service = "ReadInDatasetWithDatasetCollectionLabel";
		
		JsonObject setofprops1 = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		JsonArray arr1 = new JsonArray();
		setofprops1.add(ClassLabelConstants.PropertyValueQueryPair,arr1);
		JsonObject prop1 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		prop1.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:symmetrydefinition.dataset:structuresymmetrytype");
		prop1.addProperty(ClassLabelConstants.ShortStringKey, symmetrytype);
		arr1.add(prop1);
		
		JsonObject json = new JsonObject();
		JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
		recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		json.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, setofprops1);

		json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
		json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
		json.addProperty(DatabaseServicesBase.service, service);
		response = DatabaseServicesBase.process(json);
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			definitions = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
		} else {
		    
		}
		
		return definitions;
	}
	
	public static JsonObject getReadSymmetryResponse() {
	    return response;
	}
	
	/**
	 * @param maintainer The maintainer of the dataset
	 * @param dataset dataset name
	 * @param symmetrytype The symmetry type
	 * @param symmname The name of the specific symmetry element
	 * @return The symmetry definition JThermodynamicsSymmetryStructureDefinition
	 * 
	 * This sets up the SetOfPropertyValueQueryPairs with
	 * the symmetry type (dataset:symmetrydefinition.dataset:structuresymmetrytype) and 
	 * then the name of the symmetry definition (dataset:symmetrydefinition.dataset:symmetrydefinitionlabel)
	 * 
	 * The work is done by the ReadInDatasetWithDatasetCollectionLabel service.
	 * 
	 */
	public static JsonObject databaseSingleSymmetryDefinition(String maintainer, String dataset, String symmetrytype, String symmname) {
		JsonObject definition = null;
		response = null;
		
		String classname = "dataset:JThermodynamicsSymmetryStructureDefinition";
		String service = "ReadInDatasetWithDatasetCollectionLabel";
		
		JsonObject setofprops1 = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		JsonArray arr1 = new JsonArray();
		setofprops1.add(ClassLabelConstants.PropertyValueQueryPair,arr1);
		JsonObject prop1 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		prop1.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:symmetrydefinition.dataset:structuresymmetrytype");
		prop1.addProperty(ClassLabelConstants.ShortStringKey, symmetrytype);
		arr1.add(prop1);
		JsonObject prop2 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		prop2.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:symmetrydefinition.dataset:symmetrydefinitionlabel");
		prop2.addProperty(ClassLabelConstants.ShortStringKey, symmname);
		arr1.add(prop2);
		
		JsonObject json = new JsonObject();
		JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
		recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		json.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, setofprops1);

		json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
		json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
		json.addProperty(DatabaseServicesBase.service, service);
		response = DatabaseServicesBase.process(json);
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonArray defarr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
			if(defarr.size() > 0) {
				definition = defarr.get(0).getAsJsonObject();
			} else {
				definition = null;
			}
		}		
		return definition;
	}

}
