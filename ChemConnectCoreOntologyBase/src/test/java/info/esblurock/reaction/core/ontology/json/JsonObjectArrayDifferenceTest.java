package info.esblurock.reaction.core.ontology.json;

import static org.junit.Assert.*;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Map;

import org.junit.Test;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class JsonObjectArrayDifferenceTest {

    @Test
    public void test() {
        String json1S = "{arr: [\n"
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
                + "    ]}\n";
        
       String json2S = "{arr:  [\n"
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
               + "    ]}\n";
       JsonObject json1 = JsonObjectUtilities.jsonObjectFromString(json1S);
       JsonObject json2 = JsonObjectUtilities.jsonObjectFromString(json2S);
       Type type = new TypeToken<Map<String, Object>>(){}.getType();
       Gson gson = new Gson();
       Map<String, Object> map1 = gson.fromJson(json1, type);
       Map<String, Object> map2 = gson.fromJson(json2, type);
       ArrayList<Map<String, Object>> jsonarr1 = (ArrayList<Map<String, Object>>) map1.get("arr");
       ArrayList<Map<String, Object>> jsonarr2 = (ArrayList<Map<String, Object>>) map2.get("arr");

       int best = JsonObjectUtilities.findBestMatch(jsonarr1.get(0), jsonarr2);
       System.out.println("Best for element 0: " + best);
       best = JsonObjectUtilities.findBestMatch(jsonarr1.get(1), jsonarr2);
       System.out.println("Best for element 1: " + best);
       /*
       ArrayList<Integer> indicies = new ArrayList<Integer>(10);
       for(int i=0;i<20;i++) indicies.add(i);
       boolean found = JsonObjectUtilities.removeMatch(jsonarr1.get(0), jsonarr2,indicies);
       System.out.println("Found match to Element 0: " + found);
       found = JsonObjectUtilities.removeMatch(jsonarr1.get(1), jsonarr2,indicies);
       System.out.println("Found match to Element 1: " + found);
       best = JsonObjectUtilities.findBestMatch(jsonarr1.get(1), jsonarr2);
       System.out.println("Best for element 1: " + best);
*/
       JsonObjectUtilities.setUpDifferences(jsonarr1,jsonarr2);
       
    }
    

}
