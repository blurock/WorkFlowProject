package info.esblurock.reaction.core.ontology.base;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateWithAnnotations {

    @Test
    public void test() {
        String objectS1 = "dataset:ActivityInformationInterpretDisassociationEnergy";
        JsonObject ans1 = CreateDocumentTemplate.createTemplateWithAnnotations(objectS1);
        System.out.println(JsonObjectUtilities.toString(ans1.get("dataobject").getAsJsonObject()));
    }

}
