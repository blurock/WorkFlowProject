package info.esblurock.background.services.dataset;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FindDatasetCollections {

    static String firestoreclassname = "dataset:FirestoreCatalogID";
    static String collectiondocumentid = "dataset:CollectionDocumentIDPair";

    /**
     * Find the FirebaseCatalogID
     * 
     * @param classname The class name (type) of the object
     * @param recordid  The DatasetSpecificationForCollectionSet with Catalog
     *                  location specification
     * @return The FirebaseCatalogID
     */
    public static JsonObject findDatasetCollectionID(String classname, JsonObject recordid) {
        JsonObject empty = CreateDocumentTemplate.createTemplate(classname);
        empty.add(ClassLabelConstants.DatasetSpecificationForCollectionSet, recordid);
        // In some objects, this conflicts
        //empty.remove(ClassLabelConstants.SpecificationForDataset);
        JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(empty);
        firestoreid.remove(ClassLabelConstants.SimpleCatalogName);
         return firestoreid;
    }

    public static JsonObject findDatasetCollectionID(String classname, String maintainer, String collectionset,
            String version) {
        JsonObject empty = CreateDocumentTemplate.createTemplate(classname);
        JsonObject recordid = empty.get(ClassLabelConstants.DatasetSpecificationForCollectionSet).getAsJsonObject();
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetVersion, version);
        recordid.addProperty(ClassLabelConstants.CollectionName, collectionset);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectStatus, "CatalogObjectStatusCurrent");

        JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(empty);
        firestoreid.remove(ClassLabelConstants.SimpleCatalogName);

        return firestoreid;
    }

    /**
     * Read in entire collection
     * 
     * @param classname The class name (type) of the object
     * @param recordid  The DatasetSpecificationForCollectionSet with Catalog
     *                  location specification
     * @return The response of reading in the entire collection
     */
    public static JsonObject readInDatasetCollection(String classname, JsonObject recordid) {
        JsonObject firestoreid = findDatasetCollectionID(classname, recordid);
        JsonObject response = ReadFirestoreInformation.readFirestoreCollection(null, firestoreid);
        return response;
    }

    public static JsonObject findAllDatasetCollectionSets(JsonObject json) {
        JsonObject response = null;
        if (json.get(ClassLabelConstants.CatalogDataObjectMaintainer) != null) {
            String maintainer = json.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            Document docmessage = MessageConstructor
                    .startDocument("Find All Dataset Collection Sets for " + maintainer + " and system");
            Element body = MessageConstructor.isolateBody(docmessage);
            JsonObject sets = new JsonObject();
            JsonObject maintainerresponse = readCollectionSetForMaintainer(maintainer);
            MessageConstructor.combineBodyIntoDocument(docmessage, maintainerresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
            if(maintainerresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                JsonArray arr = maintainerresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
                if(arr.size() > 0) {
                    sets.add(ClassLabelConstants.ThermodynamicsDatasetCollectionIDsSet, arr);
                    body.addElement("div").addText(arr.size() + " collection sets for " + maintainer);
                } else {
                    body.addElement("div").addText("No collection sets for " + maintainer);
                }
            } else {
                body.addElement("div").addText("Error in reading collection sets. No collection sets for " + maintainer);
            }
            
            JsonObject systemresponse = readCollectionSetForMaintainer(DatasetCollectionCreateSystemCollection.systemhierarchy);
            MessageConstructor.combineBodyIntoDocument(docmessage, systemresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
            if(systemresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                JsonArray arr = systemresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
                if(arr.size() > 0) {
                    sets.add(ClassLabelConstants.ThermodynamicsSystemCollectionIDsSet, arr);
                    body.addElement("div").addText(arr.size() + " collection sets for " + DatasetCollectionCreateSystemCollection.systemhierarchy);
                } else {
                    body.addElement("div").addText("No collection sets for " + DatasetCollectionCreateSystemCollection.systemhierarchy);
                }
            } else {
                body.addElement("div").addText("Error in reading collection sets. No collection sets for " + DatasetCollectionCreateSystemCollection.systemhierarchy);
            }
            JsonArray ansarr = new JsonArray();
            ansarr.add(sets);
            response = StandardResponse.standardServiceResponse(docmessage, "Collection Sets read", ansarr);
        } else {
            String message = "Unsuccessful read of Dataset Collection: no maintainer specified";
            Document docmessage = MessageConstructor.startDocument("Find All Dataset Collection Sets");
            response = StandardResponse.standardErrorResponse(docmessage, message, null);
        }
        return response;

    }
    
    private static JsonObject readCollectionSetForMaintainer(String maintainer) {
        Document docmessage = MessageConstructor
                .startDocument("Find All Dataset Collection Sets for " + maintainer);
        JsonObject response = null;
        JsonObject collectionfirestore = createFirestoreForCollectionSet(maintainer);
        response = ReadFirestoreInformation.readFirestoreCollection(null, collectionfirestore);
        if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonArray arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
            String message = "Successful read of Dataset Collection " + arr.size() + " sets";
            MessageConstructor.combineBodyIntoDocument(docmessage,
                    response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
            response = StandardResponse.standardServiceResponse(docmessage, message, arr);
        } else {
            String message = "Unsuccessful read of Dataset Collection";
            MessageConstructor.combineBodyIntoDocument(docmessage,
                    response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
            response = StandardResponse.standardErrorResponse(docmessage, message, null);
        }
        return response;
    }
    
    private static JsonObject createFirestoreForCollectionSet(String maintainer) {
        JsonObject collectionfirestore = CreateDocumentTemplate.createTemplate(firestoreclassname);
        if(maintainer.equals(DatasetCollectionCreateSystemCollection.systemhierarchy)) {
            collectionfirestore.addProperty(ClassLabelConstants.DataCatalog, "systemdatasetcollections");
        } else {
            collectionfirestore.addProperty(ClassLabelConstants.DataCatalog, "hieridcollectionset");
        }
        
        collectionfirestore.remove(ClassLabelConstants.SimpleCatalogName);
        JsonObject pairset = collectionfirestore.get(ClassLabelConstants.CollectionDocumentIDPairAddress)
                .getAsJsonObject();
        JsonArray pairs = new JsonArray();
        pairset.add(ClassLabelConstants.CollectionDocumentIDPair, pairs);
        JsonObject pair = CreateDocumentTemplate.createTemplate(collectiondocumentid);
        pair.addProperty(ClassLabelConstants.DatasetDocumentID, maintainer);
        pair.addProperty(ClassLabelConstants.DatasetCollectionID, "hierthermodynamicdataset");
        pair.addProperty(ClassLabelConstants.DatasetIDLevel, "0");
        pairs.add(pair);
        return  collectionfirestore;       
    }
}
