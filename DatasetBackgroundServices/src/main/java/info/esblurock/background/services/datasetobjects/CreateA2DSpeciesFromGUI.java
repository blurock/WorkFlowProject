package info.esblurock.background.services.datasetobjects;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import java.util.List;
import java.util.ArrayList;

import info.esblurock.background.services.utilities.CreateCatalogObjectElements;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import thermo.data.structure.structure.MolFileV2000.MolFileV2000;
import info.esblurock.background.services.jthermodynamics.structure.GenerateJThermodynamics2DSpeciesStructure;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.structure.StructureAsCML;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import org.dom4j.Document;
import org.dom4j.Element;

public class CreateA2DSpeciesFromGUI {
    public static JsonObject process(JsonObject event, JsonObject info) {
        Document document = MessageConstructor.startDocument("Create a 2D Species From Graphic Interface");
        Element body = MessageConstructor.isolateBody(document);
        String classname = "dataset:JThermodynamicsSpeciesCatalogObject";
        String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
        String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
        JsonObject molecule = BaseCatalogData.createStandardDatabaseObject(classname, owner, transactionID, "true");

        JsonArray structures = info.get(ClassLabelConstants.JThermodynamicsStructureFormat).getAsJsonArray();
        molecule.add(ClassLabelConstants.JThermodynamicsStructureFormat, structures);
        boolean success = false;
        JsonObject response = null;
        List<String> formats = new ArrayList<>();
        for (JsonElement structure : structures) {
            JsonObject structobj = structure.getAsJsonObject();
            String format = structobj.get(ClassLabelConstants.SpeciesRepresentationType).getAsString();
            String molfile = structobj.get(ClassLabelConstants.SpeciesRepresentationAsText).getAsString();
            formats.add(format);
            if (format.equals("dataset:SpeciesRepresentationMolFileV2000")) {
                MolFileV2000 reader = new MolFileV2000();
                StructureAsCML structAsCML = reader.readFromMolFileV2000FromString(molfile);
                try {
                    JsonObject struct2d = GenerateJThermodynamics2DSpeciesStructure.generate(structAsCML.getMolecule());
                    molecule.add(ClassLabelConstants.JThermodynamics2DSpeciesStructure, struct2d);
                    molecule.add(ClassLabelConstants.JThermodynamicsStructureName,
                            info.get(ClassLabelConstants.JThermodynamicsStructureName));
                    molecule.add(ClassLabelConstants.ShortDescription, info.get(ClassLabelConstants.DescriptionTitle));
                    success = true;
                } catch (Exception e) {
                    String message = "Error generating 2D structure: " + e.getMessage();
                    response = StandardResponse.standardErrorResponse(document, message, null);
                }
            }

        }

        JsonObject firestoreID = BaseCatalogData.insertFirestoreAddress(molecule);
        molecule.add(ClassLabelConstants.FirestoreCatalogID, firestoreID);
        if (success) {
            try {
                body.addElement("div", "Attempting to write molecule to Firestore");
                String path = CreateHierarchyElement
                        .getPathFromFirestoreID(molecule.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject());
                body.addElement("div", "Path: " + path);
                WriteFirestoreCatalogObject.writeCatalogObjectWithException(molecule);
                JsonArray arr = new JsonArray();
                arr.add(molecule);
                response = StandardResponse.standardServiceResponse(document,
                        "Molecule successfully created and stored",
                        arr);
            } catch (Exception e) {
                if (response == null) {
                    String message = "Error writing molecule to Firestore: " + e.getMessage();
                    response = StandardResponse.standardErrorResponse(document, message, null);
                }
            }

        } else {
            response = StandardResponse.standardErrorResponse(document,
                    "Did not find a valid structure in the input\n Formats found: "
                            + formats.toString(),
                    null);
        }
        return response;
    }
}