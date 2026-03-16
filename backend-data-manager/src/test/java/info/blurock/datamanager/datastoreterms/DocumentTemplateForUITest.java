package info.blurock.datamanager.datastoreterms;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.dataset.DocumentTemplateForUI;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class DocumentTemplateForUITest {

    @Test
    public void testCreateUIDocumentTemplateSimple() {
        String classname = "dataset:DataDescriptionFileStaging";
        System.out.println("Testing UIDocumentTemplate for class: " + classname);

        JsonObject uiTemplate = DocumentTemplateForUI.createUIDocumentTemplate(classname);
        assertNotNull(uiTemplate);
        
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        System.out.println("Generated UI Template (Simple):");
        System.out.println(gson.toJson(uiTemplate));
    }

    @Test
    public void testCreateUIDocumentTemplateComplex() {
        String classname = "dataset:ActivityRepositoryInitialReadInfo";
        System.out.println("Testing UIDocumentTemplate for class: " + classname);

        JsonObject uiTemplate = DocumentTemplateForUI.createUIDocumentTemplate(classname);
        assertNotNull(uiTemplate);
        
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        System.out.println("Generated UI Template (Complex):");
        System.out.println(gson.toJson(uiTemplate));
    }
}
