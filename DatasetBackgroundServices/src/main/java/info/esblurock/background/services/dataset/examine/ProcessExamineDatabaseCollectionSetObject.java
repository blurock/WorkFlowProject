package info.esblurock.background.services.dataset.examine;

import org.dom4j.Document;
import org.dom4j.Element;

import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.DatasetCollectionIDManagement;
import info.esblurock.background.services.dataset.DatasetCollectionManagement;
import info.esblurock.background.services.dataset.ReadInDatasetWithDatasetCollectionProcess;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CompoundObjectDimensionInformation;
import info.esblurock.reaction.core.ontology.base.dataset.CompoundObjectDimensionSet;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.dataset.ParseCompoundObject;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class ProcessExamineDatabaseCollectionSetObject {
    
     /** 
      * 
     * @param info 
     * @return The response with the array of summary objects
     * 
     * info has: 
     * <ul>
     * <li> DatasetCollectionSetRecordIDInfo The specification for the dataset collection set
     * <ul>
     * <li> DatasetCollectionsSetLabel The label of the collection set
     * <li> CatalogDataObjectMaintainer The maintainer of the collection set
     * </ul>
     * <li> DatasetCollectionObjectType The specific classname of the dataset to convert
     * </ul>
     * 
     */
    public static JsonObject process(JsonObject info) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("ProcessExamineDatabaseCollectionSetObject");
        Element body = MessageConstructor.isolateBody(document);
        JsonObject recordid = info.get(ClassLabelConstants.DatasetCollectionSetRecordIDInfo).getAsJsonObject();
        String dataset = recordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
        String maintainer = recordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
        String objecttype = info.get(ClassLabelConstants.ThermodynamicDatasetCollectionType).getAsString();
        body.addElement("div").addText("Dataset  : " + dataset);
        body.addElement("div").addText("Maintainer: " + maintainer);
        body.addElement("div").addText("Object Type: " + objecttype);
        
        CompoundObjectDimensionSet set = new CompoundObjectDimensionSet();
        ParseCompoundObject.compoundObjectTypeObjects(objecttype, "<http://www.w3.org/ns/dcat#catalog>", set);
        if(set.size() > 0) {
            CompoundObjectDimensionInformation typeinfo = set.get(0);
            String classname = typeinfo.getClassname();
            body.addElement("div").addText("Classname: " + classname);
            response = ReadInDatasetWithDatasetCollectionProcess.process(maintainer, dataset, classname, null, document);
            MessageConstructor.combineBodyIntoDocument(document, response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
            JsonObject summary = CreateDocumentTemplate.createTemplate("dataset:DatasetObjectSummaryTable");
            DataObjectSummary process = DataObjectSummary.valueOf(classname.substring(8)); 
            JsonArray descriptionkey = process.objectNames();
            JsonArray searchkey = process.searchObjectNames();
            summary.add(ClassLabelConstants.SummaryTableSearchKey,searchkey);
            summary.add(ClassLabelConstants.SummaryTableDescriptionKey,descriptionkey);
            
            JsonArray searchvalues = new JsonArray();
            JsonArray descriptionvalues = new JsonArray();
            summary.add(ClassLabelConstants.DatasetObjectSummaryTableDescriptors, descriptionvalues);
            summary.add(ClassLabelConstants.DatasetObjectSummaryTableSearchTerms, searchvalues);
            if(response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                JsonArray dataobjects = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
                
                Element lst = body.addElement("ul");
                
                
                HashMap<String,HashSet<String>> termmaps = summaryOfSearchTermsInitialize(searchkey);
                JsonArray summaryelements = new JsonArray();
                for(JsonElement ele: dataobjects) {
                    JsonObject dataobject = (JsonObject) ele;
                    lst.addElement("li").setText(dataobject.get(ClassLabelConstants.CatalogObjectKey).getAsString());
                    JsonObject descriptors = DataObjectSummary.createDescriptorSummary(classname,dataobject, info);
                    JsonObject searchterms =  new JsonObject();
                    DataObjectSummary.createSearchSummary(searchterms,classname,dataobject, info);
                    descriptors.add(ClassLabelConstants.FirestoreCatalogID,
                            dataobject.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject());
                    searchvalues.add(searchterms);
                    descriptionvalues.add(descriptors);
                    summaryOfSearchTerms(searchkey,searchterms,termmaps);
                    }
                JsonObject searchsummary = summaryOfSearchTermsFinalize(termmaps);
                summary.add(ClassLabelConstants.DatasetObjectSummaryTableSearchTerms, searchsummary);
                
                String text = "Successful read of " +  summaryelements.size() + " " +  classname + " objects";
                response = StandardResponse.standardServiceResponse(document, text, summary);
            } else {
                response = StandardResponse.standardErrorResponse(document,
                        "Error: Collection Set not found (or could not be read)",
                        null);
            }
        } else {
            response = StandardResponse.standardErrorResponse(document,
                "Error: Object not defined in collection set IDs",
                null);
        }
        return response;
    }
    
    private static HashMap<String,HashSet<String>> summaryOfSearchTermsInitialize(JsonArray labels) {
        HashMap<String,HashSet<String>> summary = new HashMap<String,HashSet<String>>();
        
        for(int i=0; i<labels.size(); i++) {
            HashSet<String> terms = new HashSet<String>();
            String label = labels.get(i).getAsString();
            summary.put(label, terms);   
        }
        return summary;
    }
    private static void summaryOfSearchTerms(JsonArray labels,JsonObject terms, HashMap<String,HashSet<String>> summary) {
        for(int i=0; i<labels.size(); i++) {
            String label = labels.get(i).getAsString();
            String term = terms.get(label).getAsString();
            HashSet<String> labelterms = summary.get(label);
            labelterms.add(term);
        }
    }
    private static JsonObject summaryOfSearchTermsFinalize(HashMap<String,HashSet<String>> summary) {
        JsonObject searchterms = new JsonObject();
        Set<String> keys = summary.keySet();
        for(String key: keys) {
            HashSet<String> terms = summary.get(key);
            JsonArray labelterms = new JsonArray();
            for(String term: terms) {
                labelterms.add(term);
            }
            searchterms.add(key, labelterms);
        }
        return searchterms;
    }
}
