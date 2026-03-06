package info.esblurock.reaction.core.ontology.json;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class JsonObjectDifferenceTest {

    @Test
    public void test1() {
        String rightS1 = "{\n"
                + "  \"dataset:addressidpairs\": {\n"
                + "    \"dataset:collectiondocpair\": [\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 1,\n"
                + "        \"dataset:documentid\": \"tableA1CarbonBensonRules\",\n"
                + "        \"dataset:collectionid\": \"Standard\"\n"
                + "      },\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 0,\n"
                + "        \"dataset:documentid\": \"Adminstrator\",\n"
                + "        \"dataset:collectionid\": \"hierthermodynamicdataset\"\n"
                + "      }\n"
                + "    ],\n"
                + "    \"dataset:idlevel\": \"2\",\n"
                + "    \"dataset:tobedeleted\": \"2\"\n"
                + "  }}";
        String leftS1 = "{\n"
                + "  \"dataset:addressidpairs\": {\n"
                + "    \"dataset:collectiondocpair\": [\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 2,\n"
                + "        \"dataset:documentid\": \"addedelement\",\n"
                + "        \"dataset:collectionid\": \"Standard\"\n"
                + "      },\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 1,\n"
                + "        \"dataset:documentid\": \"tableA1CarbonBensonRules\",\n"
                + "        \"dataset:collectionid\": \"NonStandard\"\n"
                + "      },\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 0,\n"
                + "        \"dataset:documentid\": \"Adminstrator\",\n"
                + "        \"dataset:collectionid\": \"hierthermodynamicdataset\"\n"
                + "      }\n"
                + "    ],\n"
                + "    \"dataset:documentid\": \"documentid value\",\n"
                + "    \"dataset:collectionid\": \"collectionid value\",\n"
                + "    \"dataset:idlevel\": \"not assigned\"\n"
               // + "    \"dataset:listofelements\": [\"A\", \"B\", \"C\"]\n"
                + "  }}";
        System.out.println(rightS1);
        System.out.println(leftS1);
        JsonObject right = JsonObjectUtilities.jsonObjectFromString(rightS1);
        JsonObject left = JsonObjectUtilities.jsonObjectFromString(leftS1);
        JsonArray changes = JsonObjectUtilities.jsonDifference(right, left);
        System.out.println(JsonObjectUtilities.toString(changes));
    }
    @Test
    public void test2() {
        String rightS1 = "{\n"
                + "  \"dataset:addressidpairs\": {\n"
                + "    \"dataset:collectiondocpair\": [\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 2,\n"
                + "        \"dataset:documentid\": \"addedelement\",\n"
                + "        \"dataset:collectionid\": \"Standard\"\n"
                + "      },\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 1,\n"
                + "        \"dataset:documentid\": \"tableA1CarbonBensonRules\",\n"
                + "        \"dataset:collectionid\": \"Standard\"\n"
                + "      },\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 0,\n"
                + "        \"dataset:documentid\": \"Adminstrator\",\n"
                + "        \"dataset:collectionid\": \"hierthermodynamicdataset\"\n"
                + "      }\n"
                + "    ],\n"
                + "    \"dataset:idlevel\": \"2\",\n"
                + "    \"dataset:tobedeleted\": \"2\"\n"
                + "  }}";
        String leftS1 = "{\n"
                + "  \"dataset:addressidpairs\": {\n"
                + "    \"dataset:collectiondocpair\": [\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 1,\n"
                + "        \"dataset:documentid\": \"tableA1CarbonBensonRules\",\n"
                + "        \"dataset:collectionid\": \"NonStandard\"\n"
                + "      },\n"
                + "      {\n"
                + "        \"dataset:idlevel\": 0,\n"
                + "        \"dataset:documentid\": \"Adminstrator\",\n"
                + "        \"dataset:collectionid\": \"hierthermodynamicdataset\"\n"
                + "      }\n"
                + "    ],\n"
                + "    \"dataset:documentid\": \"documentid value\",\n"
                + "    \"dataset:collectionid\": \"collectionid value\",\n"
                + "    \"dataset:idlevel\": \"not assigned\"\n"
               // + "    \"dataset:listofelements\": [\"A\", \"B\", \"C\"]\n"
                + "  }}";
        System.out.println(rightS1);
        System.out.println(leftS1);
        JsonObject right = JsonObjectUtilities.jsonObjectFromString(rightS1);
        JsonObject left = JsonObjectUtilities.jsonObjectFromString(leftS1);
        JsonArray changes = JsonObjectUtilities.jsonDifference(right, left);
        System.out.println(JsonObjectUtilities.toString(changes));
    }

}
