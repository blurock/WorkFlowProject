package info.esblurock.background.services.dataset;

import static org.hamcrest.CoreMatchers.containsString;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;


public class ReadInDatasetWithDatasetCollectionProcess {
    
    
    /** Read in a specific dataset, defined by classname, within a collection set.
     * 
     * @param maintainer The maintainer of the dataset
     * @param dataset The collection set label (for the maintainer)
     * @param classname The class label of the dataset within the collection
     * @param criteria (SetOfPropertyValueQueryPairs) set of extra criteria for the dataset
     * @param document The document of the current process
     * @return The response with the JsonArray of dataset class objects.
     * 
     * This sets up the data for the service 'ReadInDatasetWithDatasetCollectionLabel'
     */
    public static JsonObject process(String maintainer, String dataset, String classname, JsonObject criteria, Document document) {
        JsonObject response = null;
        try {
        Element body = MessageConstructor.isolateBody(document);
        body.addElement("div").addText("Dataset  : " + dataset);
        body.addElement("div").addText("Maintainer: " + maintainer);
        body.addElement("div").addText("Classname: " + classname);
        
        String service = "ReadInDatasetWithDatasetCollectionLabel";

        JsonObject json = new JsonObject();
        JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);

        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
        json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
        json.addProperty(DatabaseServicesBase.service, service);
        if(criteria != null) {
            json.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, criteria);
        }
        
        response = DatabaseServicesBase.process(json);
        MessageConstructor.combineBodyIntoDocument(document, response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
        } catch(Exception ex) {
            String text = "Error in reading collection set: " + ex.getMessage();
            response = StandardResponse.standardErrorResponse(document, text, null);
            
        }
        
        return response;
    }

}
