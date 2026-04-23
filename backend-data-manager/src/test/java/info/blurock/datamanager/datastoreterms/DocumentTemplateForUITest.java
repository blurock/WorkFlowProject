package info.blurock.datamanager.datastoreterms;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.dataset.DocumentTemplateForUI;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class DocumentTemplateForUITest {
    /*
     * @Test
     * public void testCreateUIDocumentTemplateSimple() {
     * String classname = "dataset:DataDescriptionFileStaging";
     * System.out.println("Testing UIDocumentTemplate for class: " + classname);
     * 
     * JsonObject uiTemplate =
     * DocumentTemplateForUI.createUIDocumentTemplate(classname);
     * assertNotNull(uiTemplate);
     * 
     * Gson gson = new GsonBuilder().setPrettyPrinting().create();
     * System.out.println("Generated UI Template (Simple):");
     * System.out.println(gson.toJson(uiTemplate));
     * }
     */
    @Test
    public void testCreateUIDocumentTemplateComplex() {
        String classname = "dataset:ActivityRepositoryInitialReadInfo";
        System.out.println("Testing UIDocumentTemplate for class: " + classname);

        JsonObject uiTemplate = DocumentTemplateForUI.createUIDocumentTemplate(classname);
        assertNotNull(uiTemplate);

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        System.out.println("Generated UI Template (Complex):");
        JsonObject ann = uiTemplate.get("annotations").getAsJsonObject();
        System.out.println("Keys: " + ann.keySet());
        System.out.println(JsonObjectUtilities.toString(ann.get(classname).getAsJsonObject()));
        // System.out.println(gson.toJson(uiTemplate));
    }

}
