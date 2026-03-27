package info.blurock.datamanager.service.workflow;

import com.google.gson.JsonObject;
import org.springframework.stereotype.Service;

/**
 * Task to determine the Firestore collection path for a given ontology class.
 * Ontology Class: dataset:FindFirestoreHierarchyPath
 */
@Service
public class FindFirestoreHierarchyPathTask implements OntologyWorkflowTask {

    @Override
    public String getOntologyClass() {
        return "dataset:FindFirestoreHierarchyPath";
    }

    @Override
    public JsonObject execute(JsonObject input) {
        String classname = input.has("classname") ? input.get("classname").getAsString() : "";
        
        JsonObject result = new JsonObject();
        result.addProperty("classname", classname);
        
        // Mock logic: In a real implementation, this would query the ontology
        // to find the collection name associated with the class.
        String collectionName;
        if (classname.contains("Molecule")) {
            collectionName = "molecule-tasks";
        } else if (classname.contains("Calculation")) {
            collectionName = "calculations";
        } else {
            collectionName = "general-tasks";
        }
        
        result.addProperty("collectionName", collectionName);
        result.addProperty("templatePath", "users/{uid}/sessions/{sessionId}/" + collectionName);
        
        return result;
    }
}
