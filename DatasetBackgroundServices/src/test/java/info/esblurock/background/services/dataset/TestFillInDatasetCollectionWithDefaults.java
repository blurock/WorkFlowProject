package info.esblurock.background.services.dataset;

import org.dom4j.Document;
import org.dom4j.Element;
import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFillInDatasetCollectionWithDefaults {

    @Test
    public void test() {
        JsonObject json = new JsonObject();
        json.addProperty("maintainer", "Administrator");
        json.addProperty("dataset", "ThermodynamicsDataset");
        String collectiontype = "dataset:JThermodynamicsDatasetCollection";
        String owner = "me";
        try {
            Document document = MessageConstructor.startDocument("Dataset Collection Set Creation Test");
            Element body = MessageConstructor.isolateBody(document);
            DatasetCollectionManagement.fillInDatasetCollectionWithDefaults(collectiontype, owner, json, body);
            System.out.println(JsonObjectUtilities.toString(json));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
