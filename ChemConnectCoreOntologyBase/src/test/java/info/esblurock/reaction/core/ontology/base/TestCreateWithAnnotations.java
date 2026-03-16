package info.esblurock.reaction.core.ontology.base;

import static org.junit.Assert.*;

import info.esblurock.reaction.core.ontology.base.classification.DatabaseOntologyClassification;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

import org.junit.Test;

import com.google.gson.JsonObject;

public class TestCreateWithAnnotations {

    @Test
    public void test() {
        String objectS1 = "dataset:PurposeFileStaging";
        JsonObject ans1 = CreateDocumentTemplate.createTemplateWithAnnotations(objectS1);

        System.out.println(JsonObjectUtilities.toString(ans1));
        System.out.println("-------------------------------------------------------");
        JsonObject ans2 = DatabaseOntologyClassification.classificationTreeFromDataType(objectS1);
        System.out.println(JsonObjectUtilities.toString(ans2));
    }

}
