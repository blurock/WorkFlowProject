package info.esblurock.background.services.firebase;

import static org.junit.Assert.*;

import java.io.IOException;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.ServiceCollectionFirestoreCatalogAccess;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadCatalogObjectWithFirestoreAddress {

    @Test
    public void test() {
        String fireS = "{\n"
                + "      \"skos:inScheme\": \"InitialReadInLocalStorageSystem\",\n"
                + "      \"qb:DataSet\": \"56f98475-6c2c-4591-b450-ff1dac0b281e\",\n"
                + "      \"dataset:addressidpairs\": {\n"
                + "        \"dataset:collectiondocpair\": [\n"
                + "          {\n"
                + "            \"dataset:collectionid\": \"Standard\",\n"
                + "            \"dataset:documentid\": \"tableA1CarbonBensonRules\",\n"
                + "            \"dataset:idlevel\": 1\n"
                + "          },\n"
                + "          {\n"
                + "            \"dataset:collectionid\": \"hierthermodynamicdataset\",\n"
                + "            \"dataset:documentid\": \"Administrator\",\n"
                + "            \"dataset:idlevel\": 0\n"
                + "          }\n"
                + "        ]\n"
                + "      }\n"
                + "    }";
        System.out.println(fireS);
        JsonObject fire;
        fire = JsonObjectUtilities.jsonObjectFromString(fireS);
        JsonObject json = new JsonObject();
        json.addProperty("service", "ReadCatalogObjectWithFirestoreAddress");
        json.add("dataset:firestorecatalog", fire);
        JsonObject response = ServiceCollectionFirestoreCatalogAccess.ReadCatalogObjectWithFirestoreAddress.process(json);
        JsonObjectUtilities.printResponse(response);
    }

}
