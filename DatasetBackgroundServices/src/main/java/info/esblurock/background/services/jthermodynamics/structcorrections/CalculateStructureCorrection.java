package info.esblurock.background.services.jthermodynamics.structcorrections;


import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.molecule.DatasetMoleculeUtilities;
import info.esblurock.background.services.jthermodynamics.structure.GenerateJThermodynamics2DSpeciesStructure;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class CalculateStructureCorrection {
    
    public static JsonObject calculate(JsonObject info) {
        JsonObject response = null;
        String structuretype = info.get(ClassLabelConstants.JThermodynamicsSubstructureType).getAsString();
        Document document = MessageConstructor.startDocument("CalculateStructureCorrection: " + structuretype);
        if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
            JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
            String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
            Element body = MessageConstructor.isolateBody(document);
            body.addElement("div").addText("Maintainer      : " + maintainer);
            body.addElement("div").addText("dataset         : " + dataset);

            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);

            if (molecule != null) {
                JsonObject collectionresponse = 
                        FindJThermodynamics2DSubstructureThermodynamics.findJThermodynamics2DSubstructureThermodynamics(maintainer, dataset, structuretype);
                if (collectionresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                    JsonArray structureCollection = collectionresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
               
                
                response = calculate(structureCollection, molecule, info, document);
                
                } else {
                    String message = collectionresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
                    MessageConstructor.combineBodyIntoDocument(document, message);
                    response = StandardResponse.standardErrorResponse(document,
                            "Error in reading" + structuretype + " structures, check Collection dataset setup", null);
                }

            } else {
                response = StandardResponse.standardServiceResponse(document, "Problem converting molecules", null);
            }
        } else {
            String errorS = "No Collection Set Record found: Check Collection Specification";
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }
        return response;
    }

    public static JsonObject calculate(JsonArray structureCollection, IAtomContainer molecule, JsonObject info, Document document) {
        JsonObject response = null;
        Element body = MessageConstructor.isolateBody(document);
        
        
            JsonObject species = GenerateJThermodynamics2DSpeciesStructure.generate(molecule);
            try {
            JsonObject match = JThermodynamicsFindSubstructure.findLargestSubstructure(species, structureCollection);
            
            if (match != null) {
                JsonObject structure = match.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
                String moleculename = structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
                body.addElement("div").addText("Structure            : " + moleculename);
                JsonObject contribution = JThermodynamicsFindSubstructure.convertJThermodynamicsStructureToContribution(match, info);
                String name = "Contribution (derived from base: " + moleculename + ")";
                        contribution.addProperty(ClassLabelConstants.DescriptionTitle, name);
                JsonArray arr = new JsonArray();
                arr.add(contribution);
                response = StandardResponse.standardServiceResponse(document, "structure Found",
                        arr);
                } else {
                    response = StandardResponse.standardErrorResponse(document, "Error: No Corresponding structure found for radical", null);
                }
            } catch(CDKException ex) {
                String errorS = "Error in converting the molecule to JThermodynamics2DSpeciesStructure";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
                
            }
         return response;
    }

}
