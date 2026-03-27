package info.esblurock.reaction.core.ontology.base.hierarchy;

import org.junit.Test;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;

public class TestSessionHierarchy {

    @Test
    public void testSessionHierarchyCreation() {
        String classname = ClassLabelConstants.SessionData;
        String owner = "Administration";
        String transactionID = "test-transaction-id";
        String topHierarchy = "dataset:CollectionDocumentHierarchy";

        // 1. Create the dummy SessionData object
        System.out.println("Creating SessionData object for class: " + classname);
        JsonObject sessionData = CreateDocumentTemplate.createTemplate(classname);

        // 2. Ensuring the specific session properties are present (as per user request)
        sessionData.addProperty(ClassLabelConstants.UID, "UUUUU");
        sessionData.addProperty(ClassLabelConstants.DateCreated, "today");
        sessionData.addProperty(ClassLabelConstants.SessionId, "idididi");

        System.out.println("Generated SessionData Object:");
        System.out.println(JsonObjectUtilities.toString(sessionData));

        // 3. Run the hierarchy search
        System.out.println("\nRunning searchForCatalogObjectInHierarchyTemplate on default top: " + topHierarchy);
        try {
            JsonObject hierarchyResult = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(sessionData);

            if (hierarchyResult != null) {
                System.out.println("Hierarchy Result:");
                System.out.println(JsonObjectUtilities.toString(hierarchyResult));
            } else {
                System.out.println("Failed to generate hierarchy for top: " + topHierarchy);
            }
        } catch (Exception e) {
            System.err.println("Error during hierarchy generation: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Test
    public void testPathGeneration() {
        System.out.println("Testing searchForPath for class: dataset:SessionData");
        String path = CreateHierarchyElement.searchForPath("dataset:SessionData", "UUUUU", "idididi");
        System.out.println("Generated Path: " + path);
        if (path != null && path.equals("/workflows/UUUUU/sessions/idididi/SessionData/idididi")) {
            System.out.println("Path generation SUCCESS");
        } else {
            System.out
                    .println("Path generation FAILED! Expected: /workflows/UUUUU/sessions/idididi/SessionData/idididi");
        }
    }

    @Test
    public void testPathGenerationFromJson() {
        System.out.println("Testing path generation from raw JSON object");
        JsonObject json = new JsonObject();
        json.addProperty("dcterms:created", "today");
        json.addProperty("dataset:authorizationuid", "UUUUU");
        json.addProperty(AnnotationObjectsLabels.identifier, "dataset:sessiondata");
        json.addProperty("dataset:sessionId", "idididi");

        JsonObject firestoreID = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(json);
        String path = CreateHierarchyElement.getPathFromFirestoreID(firestoreID);
        System.out.println("Generated Path from JSON: " + path);
        if (path != null && path.equals("/workflows/UUUUU/sessions/idididi/SessionData/idididi")) {
            System.out.println("JSON Path generation SUCCESS");
        } else {
            System.out.println(
                    "JSON Path generation FAILED! Expected: /workflows/UUUUU/sessions/idididi/SessionData/idididi");
        }
    }
}
