package info.esblurock.reaction.core.ontology.base.dataset;

import org.junit.Test;
import java.util.Map.Entry;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestDocumentTemplateForUI {

    @Test
    public void test() {
        System.out.println("--- Testing dataset:PurposeConceptFileStaging ---");
        testClass("dataset:PurposeConceptFileStaging");
        
        System.out.println("\n--- Testing dataset:DataDescriptionFileStaging ---");
        testClass("dataset:DataDescriptionFileStaging");
        
        System.out.println("\n--- Testing dataset:ActivityRepositoryInitialReadInfo ---");
        testClass("dataset:ActivityRepositoryInitialReadInfo");
    }

    private void testClass(String classname) {
        System.out.println("Building UI template for: " + classname);
        JsonObject uiTemplate = DocumentTemplateForUI.createUIDocumentTemplate(classname);

        System.out.println("UI Template Structure:");
        System.out.println(JsonObjectUtilities.toString(uiTemplate));
        // Check for specific diagnostic output in logs instead of keySet()
        System.out.println("Data Object exists: " + uiTemplate.has("dataobject"));

        if (uiTemplate.has("dataobject")) {
            JsonObject uiStructure = uiTemplate.get("dataobject").getAsJsonObject();
            checkChoicesRecursive(uiStructure, "");
        }
    }

    private void checkChoicesRecursive(JsonObject obj, String indent) {
        if (obj.has("classname")) {
            String classname = obj.get("classname").getAsString();
            if (obj.has("isClassification") && obj.get("isClassification").getAsBoolean()) {
                System.out.println(indent + "Checking classification field: " + classname);
                if (obj.has("choices")) {
                    System.out.println(indent + "  [SUCCESS] Choices found for " + classname);
                } else {
                    System.out.println(indent + "  [FAILURE] Choices NOT found for " + classname);
                }
            }
        }

        if (obj.has("properties")) {
            JsonObject props = obj.getAsJsonObject("properties");
            for (Entry<String, JsonElement> entry : props.entrySet()) {
                checkChoicesRecursive(entry.getValue().getAsJsonObject(), indent + "  ");
            }
        }
    }
}
