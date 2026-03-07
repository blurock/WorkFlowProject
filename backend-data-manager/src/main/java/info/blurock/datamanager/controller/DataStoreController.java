package info.blurock.datamanager.controller;

import org.dom4j.Document;
import org.dom4j.Element;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;

import info.blurock.datamanager.datastoreterms.CreateDataStoreTermSet;
import info.blurock.datamanager.datastoreterms.DictionaryTermSet;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/datastore")
public class DataStoreController {

    @PostMapping(value = "/terms", produces = "application/json")
    public String getDataStoreTerms(@RequestBody Map<String, String> params) {
        try {
            Document doc = MessageConstructor.startDocument("DataStoreTerms");
            String topclassname = params.get("topclassname");
            String datatype = params.get("datatype");
            
            System.out.println("Processing terms for Class: " + topclassname + ", Type: " + datatype);

            // 1. Call createDataStoreDataObjectTermSet
            DictionaryTermSet termSet = CreateDataStoreTermSet.createDataStoreDataObjectTermSet(topclassname, datatype);
            JsonArray termsArray = termSet.toJsonArray();
            
            JsonObject response = StandardResponse.standardServiceResponse(doc, "Successful generation of DataStoreTerms", termsArray);
            
            return response.toString();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in getDataStoreTerms:");
            e.printStackTrace();
            
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("dataset:servicesuccessful", "false");
            errorResponse.addProperty("dataset:serviceresponsemessage", "Server-side exception: " + e.getMessage());
            return errorResponse.toString();
        }
    }
}
