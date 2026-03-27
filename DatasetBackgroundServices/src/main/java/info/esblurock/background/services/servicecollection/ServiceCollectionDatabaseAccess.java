package info.esblurock.background.services.servicecollection;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.symmetry.ExtractSetOfSymmetryDefinitionsFromDataset;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.background.services.jthermodynamics.dataset.FindMetaAtomDefinitionsInDatasetCollection;

public enum ServiceCollectionDatabaseAccess {
	
	FindSetOfSymmetryElements {

		@Override
		public JsonObject process(JsonObject info) {
			Document document = MessageConstructor.startDocument("FindSetOfSymmetryElements");
			Element body = MessageConstructor.isolateBody(document);
			JsonObject response = null;
			String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String dataset = info.get(ClassLabelConstants.CollectionName).getAsString();
			String symmetrytype = info.get(ClassLabelConstants.StructureSymmetryType).getAsString();
			body.addElement("div").addText("Maintainer: " + maintainer);
			body.addElement("div").addText("dataset   : " + dataset);
			body.addElement("div").addText("Maintainer: " + symmetrytype);
			JsonArray arr = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSymmetryDefinitions(maintainer, 
					dataset, symmetrytype);
			if(arr != null) {
				body.addElement("div").addText("Read in " + arr.size() + " Symmetry elements");
				
				Element table = body.addElement("table");
				Element hrow = table.addElement("tr");
				hrow.addElement("th").addText("Symmetry Label");
				hrow.addElement("th").addText("Symmetry Type");
				hrow.addElement("th").addText("Structure");
				hrow.addElement("th").addText("Symmetry");

				for(int i=0; i < arr.size() ; i++) {
					JsonObject symmetry = arr.get(i).getAsJsonObject();
					JsonObject symdef = symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
					String label = symdef.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
					String type = symdef.get(ClassLabelConstants.StructureSymmetryType).getAsString();
					String factor = symdef.get(ClassLabelConstants.SymmetryFactorOfStructure).getAsString();
					JsonObject struct = symmetry.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
					String structname = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
					
					Element drow = table.addElement("tr");
					drow.addElement("td").addText(label);
					drow.addElement("td").addText(type);
					drow.addElement("td").addText(structname);
					drow.addElement("td").addText(factor);
				}
				
				
				response = StandardResponse.standardServiceResponse(document, "FindSetOfSymmetryElements", arr);
			} else {
				body.addElement("div").addText("Error in reading symmetry elements");
				response = StandardResponse.standardErrorResponse(document, "Error in reading External Symmetry", null);
			}
			return response;
		}
		
	}, FindSymmetryElement {

		@Override
		public JsonObject process(JsonObject info) {
			Document document = MessageConstructor.startDocument("FindSetOfSymmetryElements");
			Element body = MessageConstructor.isolateBody(document);
			JsonObject response = null;
			String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String dataset = info.get(ClassLabelConstants.CollectionName).getAsString();
			String symmetrytype = info.get(ClassLabelConstants.StructureSymmetryType).getAsString();
			String symmname = info.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
			body.addElement("div").addText("Maintainer: " + maintainer);
			body.addElement("div").addText("dataset   : " + dataset);
			body.addElement("div").addText("Maintainer: " + symmetrytype);
			
			JsonObject symmetry = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSingleSymmetryDefinition(maintainer,
					dataset, symmetrytype, symmname);
			if(symmetry != null) {
				Element table = body.addElement("table");
				Element hrow = table.addElement("tr");
				hrow.addElement("th").addText("Symmetry Label");
				hrow.addElement("th").addText("Symmetry Type");
				hrow.addElement("th").addText("Structure");
				hrow.addElement("th").addText("Symmetry");

					JsonObject symdef = symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
					String label = symdef.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
					String type = symdef.get(ClassLabelConstants.StructureSymmetryType).getAsString();
					String factor = symdef.get(ClassLabelConstants.SymmetryFactorOfStructure).getAsString();
					JsonObject struct = symmetry.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
					String structname = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
					
					Element drow = table.addElement("tr");
					drow.addElement("td").addText(label);
					drow.addElement("td").addText(type);
					drow.addElement("td").addText(structname);
					drow.addElement("td").addText(factor);

				
				response = StandardResponse.standardServiceResponse(document, "FindSetOfSymmetryElements", symmetry);
			} else {
				response = StandardResponse.standardErrorResponse(document, "Error in reading External Symmetry", null);				
			}
			return response;
		}
		
	}, FindSetOfMetaAtoms {

		@Override
		public JsonObject process(JsonObject info) {
			Document document = MessageConstructor.startDocument("FindSetOfMetaAtoms");
			Element body = MessageConstructor.isolateBody(document);
			JsonObject response = null;
			String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String dataset = info.get(ClassLabelConstants.CollectionName).getAsString();
			String metaatomtype = info.get(ClassLabelConstants.JThermodynamicsMetaAtomType).getAsString();
			body.addElement("div").addText("Maintainer: " + maintainer);
			body.addElement("div").addText("dataset   : " + dataset);
			body.addElement("div").addText("Metaatom type: " + metaatomtype);
			JsonArray arr = FindMetaAtomDefinitionsInDatasetCollection.findMetaAtomDefinitions(maintainer, dataset, metaatomtype);
			if(arr != null) {
				body.addElement("div").addText("Read in " + arr.size() + " Symmetry elements");
				
				Element table = body.addElement("table");
				Element hrow = table.addElement("tr");
				hrow.addElement("th").addText("Meta Atom Label");
				hrow.addElement("th").addText("Meta Atom Type");
				hrow.addElement("th").addText("Structure Name");

				for(int i=0; i < arr.size() ; i++) {
					JsonObject metaatomdefinition = arr.get(i).getAsJsonObject();
					JsonObject metaatom = metaatomdefinition.get(ClassLabelConstants.JThermodynamicsMetaAtomInfo).getAsJsonObject();
					String label = metaatom.get(ClassLabelConstants.JThermodynamicsMetaAtomLabel).getAsString();
					String type = metaatom.get(ClassLabelConstants.JThermodynamicsMetaAtomType).getAsString();
					String structname = metaatom.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
					
					Element drow = table.addElement("tr");
					drow.addElement("td").addText(label);
					drow.addElement("td").addText(type);
					drow.addElement("td").addText(structname);
				}
				
				
				response = StandardResponse.standardServiceResponse(document, "FindSetOfSymmetryElements", arr);
			} else {
				body.addElement("div").addText("Error in reading symmetry elements");
				response = StandardResponse.standardErrorResponse(document, "Error in reading External Symmetry", null);
			}
			return response;
		}
		
	}, ;

	
	public abstract JsonObject process(JsonObject json);
	
}
