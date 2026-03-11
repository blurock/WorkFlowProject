package info.blurock.datamanager.datastoreterms;

import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DataTermsUtilities {

    /**
     * Creates a template for the given classname and returns a list of ontology classnames
     * for properties that are simple strings in the resulting JSON object.
     * 
     * @param classname The ontology class name (e.g., "dataset:ActivityRepositoryInitialReadLocalFile")
     * @return A list of ontology classnames corresponding to simple string properties.
     */
    public static List<String> getSimpleProperties(String classname) {
        JsonObject obj = CreateDocumentTemplate.createTemplate(classname);
        List<String> simpleProperties = new ArrayList<>();
        
        if (obj != null) {
            for (Map.Entry<String, JsonElement> entry : obj.entrySet()) {
                if (entry.getValue().isJsonPrimitive() && entry.getValue().getAsJsonPrimitive().isString()) {
                    String identifier = entry.getKey();
                    String classFromId = OntologyUtilityRoutines.typesFromIdentifier(identifier);
                    if (classFromId != null) {
                        simpleProperties.add(classFromId);
                    } else {
                        // Fallback to the identifier itself if no classname is found, 
                        // or skip if that's preferred. The user asked for classnames.
                        simpleProperties.add(identifier);
                    }
                }
            }
        }
        return simpleProperties;
    }
}
