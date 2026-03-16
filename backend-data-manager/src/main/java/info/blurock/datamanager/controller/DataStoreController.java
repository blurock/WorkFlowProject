package info.blurock.datamanager.controller;

import org.dom4j.Document;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;

import info.blurock.datamanager.datastoreterms.CreateDataStoreTermSet;
import info.blurock.datamanager.datastoreterms.CreateDataStoreTermsFromClasses;
import info.blurock.datamanager.datastoreterms.DictionaryTermSet;
import info.blurock.datamanager.datastoreterms.WriteDictionaryTerms;
import info.blurock.datamanager.datastoreterms.DataStoreImporter;
import info.blurock.datamanager.datastoreterms.DictionarySearchService;
import info.blurock.datamanager.datastoreterms.FillInOntologyObject;
import info.blurock.datamanager.datastoreterms.ExtractDescription;
import info.esblurock.reaction.core.ontology.base.dataset.DocumentTemplateForUI;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/datastore")
public class DataStoreController {

    @Autowired
    private DictionarySearchService dictionarySearchService;

    @Autowired
    private FillInOntologyObject fillInService;

    @Autowired
    private ExtractDescription extractDescriptionService;

    @PostMapping(value = "/ui-template", produces = "application/json")
    public String getUITemplate(@RequestBody Map<String, Object> params) {
        try {
            org.dom4j.Document doc = MessageConstructor.startDocument("UITemplate");
            String classname = (String) params.get("classname");
            
            System.out.println("Generating UI Template for Class: " + classname);

            JsonObject template = DocumentTemplateForUI.createUIDocumentTemplate(classname);
            
            JsonObject response = StandardResponse.standardServiceResponse(doc, "Template generated successfully", template);
            
            return response.toString();
        } catch (Throwable e) {
            System.err.println("CRITICAL ERROR in getUITemplate:");
            e.printStackTrace();
            
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("dataset:servicesuccessful", "false");
            errorResponse.addProperty("dataset:serviceresponsemessage", "Template-side exception (" + e.getClass().getSimpleName() + "): " + e.getMessage());
            return errorResponse.toString();
        }
    }

    @PostMapping(value = "/terms", produces = "application/json")
    public String getDataStoreTerms(@RequestBody Map<String, Object> params) {
        try {
            Document doc = MessageConstructor.startDocument("DataStoreTerms");
            String topclassname = (String) params.get("topclassname");
            String datatype = (String) params.get("datatype");
            boolean shouldWrite = Boolean.TRUE.equals(params.get("writetodatastore"));
            boolean shouldClear = Boolean.TRUE.equals(params.get("clearfirestore"));
            String source = (String) params.getOrDefault("source", "terms");
            
            System.out.println("Processing terms for Class: " + topclassname + ", Type: " + datatype + ", Source: " + source + ", Write to DB: " + shouldWrite + ", Clear: " + shouldClear);

            if (shouldClear) {
                WriteDictionaryTerms.clearCollection();
            }

            // 1. Call extraction method based on source
            DictionaryTermSet termSet;
            if ("classes".equalsIgnoreCase(source)) {
                termSet = CreateDataStoreTermsFromClasses.createDataStoreTermsFromClasses(topclassname, datatype);
            } else {
                termSet = CreateDataStoreTermSet.createDataStoreDataObjectTermSet(topclassname, datatype);
            }
            JsonArray termsArray = termSet.toJsonArray();
            
            String message = "Successful generation of DataStoreTerms";
            if (shouldWrite) {
                boolean firestoreSuccess = WriteDictionaryTerms.write(termSet);
                if (firestoreSuccess) {
                    message += " and wrote to Firestore.";
                    System.out.println("Triggering Discovery Engine Sync...");
                    String opName = DataStoreImporter.importFromFirestore();
                    message += (opName != null) ? " Discovery Engine sync triggered (Op: " + opName + ")." : " but Discovery Engine sync FAILED to trigger (check logs).";
                } else {
                    message += " but FAILED to write to Firestore (check logs).";
                }
            }
            
            JsonObject response = StandardResponse.standardServiceResponse(doc, message, termsArray);
            
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

    @PostMapping(value = "/test-search", produces = "application/json")
    public String testSearch(@RequestBody Map<String, Object> params) {
        try {
            Document doc = MessageConstructor.startDocument("DataStoreTestSearch");
            String query = (String) params.get("query");
            String datatype = (String) params.get("datatype");
            
            System.out.println("Processing test search for Query: " + query + ", Type: " + datatype);

            JsonObject resultObj = dictionarySearchService.searchDictionaryTerm(query, datatype);
            
            JsonObject response = StandardResponse.standardServiceResponse(doc, "Search successful", resultObj);
            
            return response.toString();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in testSearch:");
            e.printStackTrace();
            
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("dataset:servicesuccessful", "false");
            errorResponse.addProperty("dataset:serviceresponsemessage", "Search-side exception: " + e.getMessage());
            return errorResponse.toString();
        }
    }

    @PostMapping(value = "/list-terms", produces = "application/json")
    public String listTermsByDatatype(@RequestBody Map<String, Object> params) {
        try {
            org.dom4j.Document doc = info.esblurock.reaction.core.MessageConstructor.startDocument("ListDataStoreTerms");
            String datatype = (String) params.get("datatype");
            
            System.out.println("Listing terms for Datatype: " + datatype);

            DictionaryTermSet termSet = dictionarySearchService.getTermsByDatatype(datatype);
            JsonArray termsArray = termSet.toJsonArray();
            
            JsonObject response = info.esblurock.reaction.core.StandardResponse.standardServiceResponse(doc, "Fetched " + termSet.getTerms().size() + " terms.", termsArray);
            
            return response.toString();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in listTermsByDatatype:");
            e.printStackTrace();
            
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("dataset:servicesuccessful", "false");
            errorResponse.addProperty("dataset:serviceresponsemessage", "List-side exception: " + e.getMessage());
            return errorResponse.toString();
        }
    }

    @PostMapping(value = "/fill-in-object", produces = "application/json")
    public String fillInObject(@RequestBody Map<String, Object> params) {
        try {
            Document doc = MessageConstructor.startDocument("FillInOntologyObject");
            String prompt = (String) params.get("prompt");
            String classname = (String) params.get("classname");
            String datatype = (String) params.get("datatype");

            System.out.println("Processing fill-in for Class: " + classname + ", Type: " + datatype);

            FillInOntologyObject.FillInResult result = fillInService.fillInProperties(prompt, classname, datatype);

            JsonObject resultObj = new JsonObject();
            
            JsonObject assignedObj = new JsonObject();
            result.getAssignedProperties().forEach(assignedObj::addProperty);
            
            JsonArray unassignedArray = new JsonArray();
            result.getUnassignedProperties().forEach(unassignedArray::add);

            resultObj.add("assignedProperties", assignedObj);
            resultObj.add("unassignedProperties", unassignedArray);

            JsonObject response = StandardResponse.standardServiceResponse(doc, "Extraction successful", resultObj);
            return response.toString();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in fillInObject:");
            e.printStackTrace();

            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("dataset:servicesuccessful", "false");
            errorResponse.addProperty("dataset:serviceresponsemessage", "Extraction-side exception: " + e.getMessage());
            return errorResponse.toString();
        }
    }

    @PostMapping(value = "/extract-description", produces = "application/json")
    public String extractDescription(@RequestBody Map<String, Object> params) {
        try {
            Document doc = MessageConstructor.startDocument("ExtractDescription");
            String prompt = (String) params.get("prompt");
            String datatype = (String) params.get("datatype");

            System.out.println("Processing extract-description for type: " + datatype);

            ExtractDescription.DescriptionResult result = extractDescriptionService.extract(prompt, datatype);

            JsonObject resultObj = new JsonObject();
            resultObj.addProperty("description", result.getDescription());
            resultObj.addProperty("title", result.getTitle());
            resultObj.addProperty("keyword", result.getKeyword());

            JsonObject response = StandardResponse.standardServiceResponse(doc, "Extraction successful", resultObj);
            return response.toString();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in extractDescription:");
            e.printStackTrace();

            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("dataset:servicesuccessful", "false");
            errorResponse.addProperty("dataset:serviceresponsemessage", "Extraction-side exception: " + e.getMessage());
            return errorResponse.toString();
        }
    }
}
