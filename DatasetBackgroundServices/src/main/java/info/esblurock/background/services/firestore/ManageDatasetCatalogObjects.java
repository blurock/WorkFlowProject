package info.esblurock.background.services.firestore;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

import org.apache.commons.text.StringEscapeUtils;
import org.dom4j.Document;
import org.dom4j.Element;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import info.esblurock.background.services.dataset.FindDatasetCollections;
import info.esblurock.background.services.dataset.ManageDatasetDocumentLists;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

/** ManageDatasetCatalogObjects
 * 
 * @author edwardblurock
 * 
 * All collection set interactions with the Firestore database is done within this class. 
 * This class manages ALL the catalog object writes and deletes (and moves). 
 * Part of this management includes keeping a record (within the collection of catalog objects)
 *  of the ids of the objects within the collection (this is done through class ManageDatasetDocumentLists). 
 *  All writes are kept within this class to promote consistency.
 *  
 *  NO individual writes should be done with the collection. 
 *  This class deals with a JsonArray of catalog objects
 * 
 *
 */
public class ManageDatasetCatalogObjects extends DeleteCatalogDataObject {
    
    

    public static JsonObject processDatasetCollectionSetObjectManagementMove(JsonObject event, JsonObject info) {
        Document document = MessageConstructor.startDocument("DatasetCollectionSetObjectManagementMove");
        
        JsonObject response = null;
        String erroroutput = checkInput(info, true);
        if (erroroutput != null) {
            Element body = MessageConstructor.isolateBody(document);

            JsonArray ids = info.get(ClassLabelConstants.SimpleCatalogName).getAsJsonArray();
            String classname = info.get(ClassLabelConstants.DatasetCollectionObjectType).getAsString();
            JsonObject sourcecoll = info.get(ClassLabelConstants.DatasetSpecificationforSourceCollectionSet)
                    .getAsJsonObject();
            JsonObject destinationcoll = info.get(ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet)
                    .getAsJsonObject();
            JsonObject catalog = setUpCatalogObject(event, classname, "dataset:DatasetCollectionSetObjectManagementMove", ids, sourcecoll, destinationcoll);
            JsonObject srccollfirestoreid = FindDatasetCollections.findDatasetCollectionID(classname, sourcecoll);
            JsonObject destcollfirestoreid = FindDatasetCollections.findDatasetCollectionID(classname, destinationcoll);

            response = movecpyCatalogObjectsTransaction(catalog, ids, srccollfirestoreid, destcollfirestoreid, false, document);
        } else {
            response = StandardResponse.standardErrorResponse(document, erroroutput, null);
        }
        return response;
    }

    public static JsonObject processDatasetCollectionSetObjectManagementCopy(JsonObject event, JsonObject info) {
        Document document = MessageConstructor.startDocument("DatasetCollectionSetObjectManagementCopy");
        JsonObject response = null;
        String erroroutput = checkInput(info, true);
        if (erroroutput != null) {
            Element body = MessageConstructor.isolateBody(document);
            JsonArray ids = info.get(ClassLabelConstants.SimpleCatalogName).getAsJsonArray();
            String classname = info.get(ClassLabelConstants.DatasetCollectionObjectType).getAsString();
            JsonObject sourcecoll = info.get(ClassLabelConstants.DatasetSpecificationforSourceCollectionSet)
                    .getAsJsonObject();
            JsonObject destinationcoll = info.get(ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet)
                    .getAsJsonObject();
            JsonObject catalog = setUpCatalogObject(event, classname, "dataset:DatasetCollectionSetObjectManagementCopy", ids, sourcecoll, destinationcoll);
            JsonObject srccollfirestoreid = FindDatasetCollections.findDatasetCollectionID(classname, sourcecoll);
            JsonObject destcollfirestoreid = FindDatasetCollections.findDatasetCollectionID(classname, destinationcoll);

            response = movecpyCatalogObjectsTransaction(catalog, ids, srccollfirestoreid, destcollfirestoreid, false, document);
        } else {
            response = StandardResponse.standardErrorResponse(document, erroroutput, null);
        }
        return response;
    }

    public static JsonObject processDatasetCollectionSetObjectManagementDelete(JsonObject event, JsonObject info) {
        Document document = MessageConstructor.startDocument("DatasetCollectionSetObjectManagementDelete");
        JsonObject response = null;
        String erroroutput = checkInput(info, true);
        if (erroroutput != null) {
            Element body = MessageConstructor.isolateBody(document);

            JsonArray ids = info.get(ClassLabelConstants.SimpleCatalogName).getAsJsonArray();
            body.addElement("div","Delete " + ids.size() + " objects");
            String classname = info.get(ClassLabelConstants.DatasetCollectionObjectType).getAsString();
            JsonObject sourcecoll = info.get(ClassLabelConstants.DatasetSpecificationforSourceCollectionSet)
                    .getAsJsonObject();
            JsonObject catalog = setUpCatalogObject(event, classname, "dataset:DatasetCollectionSetObjectManagementDelete", ids, sourcecoll, sourcecoll);
            JsonObject srccollfirestoreid = FindDatasetCollections.findDatasetCollectionID(classname, sourcecoll);
            JsonObject destcollfirestoreid = createDeletedCollectionFirestoreID(srccollfirestoreid);

            response = movecpyCatalogObjectsTransaction(catalog, ids, srccollfirestoreid, destcollfirestoreid, true, document);
        } else {
            response = StandardResponse.standardErrorResponse(document, erroroutput, null);
        }
        return response;
    }

    private static String checkInput(JsonObject info, boolean dest) {
        String ok = null;
        if (info.get(ClassLabelConstants.SimpleCatalogName) != null) {
            if (info.get(ClassLabelConstants.DatasetCollectionObjectType) != null) {
                if (info.get(ClassLabelConstants.DatasetSpecificationforSourceCollectionSet) != null) {
                    if (dest) {
                        if (info.get(ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet) == null) {
                            ok = "Destination collection set not found in input: "
                                    + ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet;
                        }
                    }
                } else {
                    ok = "Source collection set not found in input: "
                            + ClassLabelConstants.DatasetSpecificationforSourceCollectionSet;
                }
            } else {
                ok = "Object type not found in input: " + ClassLabelConstants.DatasetCollectionObjectType;
            }
        } else {
            ok = "Array of object ids not found in input: " + ClassLabelConstants.SimpleCatalogName;
        }

        return ok;
    }
    
    private static JsonObject setUpCatalogObject(JsonObject event, String classname, String type, JsonArray ids,JsonObject sourcecoll,JsonObject destinationcoll) {
        String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
        String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
        JsonObject catalog = BaseCatalogData.createStandardDatabaseObject("dataset:ChemConnectDatasetCollectionObjectManipulation", owner,
                transactionID, "false");
        catalog.addProperty(ClassLabelConstants.CollectionModificationType, type);
        catalog.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
        catalog.add(ClassLabelConstants.SimpleCatalogName, ids);
        catalog.add(ClassLabelConstants.DatasetSpecificationforSourceCollectionSet, sourcecoll);
        catalog.add(ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet, destinationcoll);
        
        return catalog;
   }

    /**
     * Generate the FirestoreiD of the deleted objects from the source directory
     * 
     * @param uniquename:      The unique name of the objects being deleted
     * @param sourcecollection The FirestoreID of the sourcecollection
     * @return The FirestoreiD of the deleted objects from the source directory
     */
    public static JsonObject createDeletedCollectionFirestoreID(JsonObject sourcecollection) {
        String uniquename = UUID.randomUUID().toString();
        JsonObject src = sourcecollection.deepCopy();
        String collection = src.get(ClassLabelConstants.DataCatalog).getAsString();
        JsonObject pairaddress = src.get(ClassLabelConstants.CollectionDocumentIDPairAddress).getAsJsonObject();
        JsonArray pairs = pairaddress.get(ClassLabelConstants.CollectionDocumentIDPair).getAsJsonArray();
        int count = pairs.size();
        JsonObject pair = new JsonObject();
        pair.addProperty(ClassLabelConstants.DatasetCollectionID, collection);
        pair.addProperty(ClassLabelConstants.DatasetDocumentID, OntologyObjectLabels.deletecollection);
        pair.addProperty(ClassLabelConstants.DatasetIDLevel, Integer.toString(count));
        src.addProperty(ClassLabelConstants.DataCatalog, uniquename);
        src.remove(ClassLabelConstants.SimpleCatalogName);
        return src;
    }

    /**
     * Move (and/or delete) catalog objects from collection
     * 
     * @param ids              The set of ids of the catalog objects to move
     * @param sourcecollection The dataset collection to move from
     *                         (FirestoreCatalogID)
     * @param destcollection   The dataset collection to move to
     *                         (FirestoreCatalogID)
     * @param deletesrc        true if the source is to be deleted.
     * @return the response of the action
     * 
     *         The definition of 'deleting' a catalog object is actually delete it
     *         from the collection and move a copy of the deleted catalog objects to
     *         another directory. Moving the catalog objects to another directory
     *         also involves deleting the catalog object from the source collection.
     * 
     *         This routine can also be used to copy a catalog objects to another
     *         directory (for example copying a collection for a user).
     * 
     *         This routine is used using FirestoreCatalogID because the source and
     *         destination have alread been established by calling routines.
     * 
     * 
     */
    public static JsonObject movecpyCatalogObjectsTransaction(JsonObject catalog, JsonArray ids, JsonObject sourcecollection,
            JsonObject destcollection, boolean deletesrc, Document document) {
        JsonObject response = null;
        Element body = MessageConstructor.isolateBody(document);
        

        getFirestoreID();
        Type type = new TypeToken<HashMap<String, Object>>() {
        }.getType();
        Element div = body.addElement("div");
        if (deletesrc) {
            div.addElement("h2", "Move and delete Source (" + ids.size() + ")");
        } else {
            div.addElement("h2", "Move keeping Source");
        }
        div.addElement("h3", "Move From");
        //String escsrc = StringEscapeUtils.escapeHtml3(JsonObjectUtilities.toString(sourcecollection));
        String escsrc = JsonObjectUtilities.toString(sourcecollection);
        Element pre1 = div.addElement("pre");
        pre1.addText(escsrc);
        div.addElement("h3", "Move To");
        //String escdest = StringEscapeUtils.escapeHtml3(JsonObjectUtilities.toString(destcollection));
        String escdest = JsonObjectUtilities.toString(destcollection);
        Element pre2 = div.addElement("pre");
        pre2.addText(escdest);
        div.addElement("h3", "Element IDs to move");
        Element lst = div.addElement("ul");
        JsonArray sourcefirestoreids = new JsonArray();
        catalog.add(ClassLabelConstants.SetOfSourceFirestoreIDs, sourcefirestoreids);
        JsonArray destfirestoreids = new JsonArray();
        catalog.add(ClassLabelConstants.SetOfDestinationFirestoreIDs, destfirestoreids);
        //db.runTransaction(transaction -> {
            for (int i = 0; i < ids.size(); i++) {
                String id = ids.get(i).getAsString();
                
                String lstele = "Copy: " + id;
                if(deletesrc) {
                    lstele = "Move/Delete: " + id;
                }
                Element li = lst.addElement("li");
                li.addText(lstele);
                JsonObject source = buildNewFirestore(sourcecollection, id);
                JsonObject destination = buildNewFirestore(destcollection, id);
                
                sourcefirestoreids.add(source);
                destfirestoreids.add(destination);
                DocumentReference docrefsource = SetUpDocumentReference.setup(db, source);
                //DocumentSnapshot sourcesnap = transaction.get(docrefsource).get();
                ApiFuture<DocumentSnapshot> future = docrefsource.get();
                DocumentSnapshot sourcesnap;
                try {
                    sourcesnap = future.get();
                    Map<String, Object> srcfiremap = sourcesnap.getData();
                    String srcString = new Gson().toJson(srcfiremap);
                    JsonObject srccatalog = JsonObjectUtilities.jsonObjectFromString(srcString);
                    
                    JsonObject destcatalog = srccatalog.deepCopy();
                    destcatalog.add(ClassLabelConstants.FirestoreCatalogID, destination);
                    DocumentReference docrefdest = SetUpDocumentReference.setup(db, destination);
                    Map<String, Object> destmapObj = new Gson().fromJson(destcatalog, type);
                    //transaction.set(docrefdest, destmapObj);
                    docrefdest.set(destmapObj);
                    if (deletesrc) {
                        docrefsource.delete();
                    }
                } catch (InterruptedException | ExecutionException e) {
                    
                    Element lierr = lst.addElement("li");
                    lierr.addText("Move failed: doesn't exist " + id);
                }
            }
            //return null;
        //});
        String message = "Copy " + sourcefirestoreids.size() + " Catalog objects";
        if(deletesrc) {
            message = "Moved " + sourcefirestoreids.size() + " Catalog objects";
        }
        JsonArray destarr = new JsonArray();
        destarr.add(catalog);
        response = StandardResponse.standardServiceResponse(document, message, destarr);
        return response;
    }

    private static JsonObject buildNewFirestore(JsonObject collection, String ID) {
        JsonObject newcollection = collection.deepCopy();
        newcollection.addProperty(ClassLabelConstants.SimpleCatalogName, ID);
        return newcollection;
    }
    
    /** Write a set of catalog objects to a collection
     * 
     * @param event The transaction (DatasetCollectionObjectSetWriteTransaction)
     * @param classname The classname of the catalog object to write
     * @param collectionset The collection set to which the catalog objects belong
     * @param set The set of catalog objects to write
     * @return The response 
     * 
     * this is the main routine to write a set of objects to a collection.
     * This routine takes care of the case where some of the catalog objects should be replaced.
     * Replacing an object means that original object is moved to the delete hierarchy and the new object is written.
     * 
     * This assumes:
     * <ul>
     * <li> Classname corresponds to the objects to be written
     * <li> collectionset  corresponds to the objects to be written
     * <li> The SimpleCatalogName of the objects is unique for that object information.
     * </ul>
     * 
     */
    public static JsonObject writeSetOfCatalogObjects(JsonObject event, String classname, JsonObject collectionset, JsonArray set) {
        Document document = MessageConstructor.startDocument("DatasetCollectionSetObjectManagementWrite");
        Element body = MessageConstructor.isolateBody(document);

        String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
        String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
        //JsonObject catalog = BaseCatalogData.createStandardDatabaseObject("dataset:DatasetCollectionObjectSetWriteTransaction", owner,
        //        transactionID, "false");
        
        JsonObject response = null;
        List<String> datasetIDs = ManageDatasetDocumentLists.getCollectionIDs(classname, collectionset);
        List<String> catalogIDs = getCatalogIDs(set);
        if(datasetIDs.size() == 0) {
            writeWithNoCommonCatalogObjects(event,body,set,classname,collectionset);
            String message = "Writing a new collection with a set of catalog objects";
            response = StandardResponse.standardServiceResponse(document, message, set);
       } else {
            List<String> common = new ArrayList<String>(datasetIDs);
            common.retainAll(catalogIDs);
            List<String> union = new ArrayList<String>(datasetIDs);
            union.removeAll(common);
            union.addAll(catalogIDs);
            JsonObject deleteresponse = null;
            Element div1 = body.addElement("div");
            div1.addText("Number of common elements (to be deleted): " + common.size());
            Element div2 = body.addElement("div");
            div2.addText("Number of elements in collection after write: " + union.size());
            
            if(common.size() > 0) {
                deleteresponse = deleteDatasetCatalogObjects(listOfStringsToJsonArray(common),classname,collectionset,event);
                if(deleteresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                    String deletemessage = deleteresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
                    MessageConstructor.combineBodyIntoDocument(document, deletemessage); 
                    JsonArray destarr = deleteresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
                    if(destarr.size() > 0) {
                        JsonObject deletecatalog = destarr.get(0).getAsJsonObject();
                        if(deletecatalog.get(ClassLabelConstants.SetOfDestinationFirestoreIDs)!= null) {
                            JsonArray deleted = deletecatalog.get(ClassLabelConstants.SetOfDestinationFirestoreIDs).getAsJsonArray();
                            
                            event.add(ClassLabelConstants.DataCatalogOutputObjectReplaced, deleted);
                            JsonArray firestoreids = writeDatasetElements(body,set);
                            ManageDatasetDocumentLists.writeCollectionIDs(union,classname,collectionset);
                            event.add(ClassLabelConstants.DatabaseObjectIDOutputTransaction, firestoreids);                                           
                            String message = "";
                            response = StandardResponse.standardServiceResponse(document, message, set);
                        } else {
                            response = errorInDeletingResponse(deleteresponse,document, "Write failed while deleting common elements Write failed while deleting common elements (no firestore list produced)");                           
                        }
                    } else {
                        response = errorInDeletingResponse(deleteresponse,document, "Write failed while deleting common elements Write failed while deleting common elements (no catalog object produced)");
                    }
                 } else {
                     response = errorInDeletingResponse(deleteresponse,document, "Write failed while deleting common elements");
                 }
             } else {
                 writeWithNoCommonCatalogObjects(event,body,set,classname,collectionset);
                 datasetIDs.addAll(catalogIDs);
                 ManageDatasetDocumentLists.writeCollectionIDs(datasetIDs,classname,collectionset);
                 String message = "Writing to a collection with a set of unique catalog objects (no duplicates)";
                 response = StandardResponse.standardServiceResponse(document, message, set);
             }
        }
        return response;
    }
    
    private static JsonObject errorInDeletingResponse(JsonObject deleteresponse, Document document, String errorresponse) {
        String message = deleteresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
        MessageConstructor.combineBodyIntoDocument(document, message);
        JsonObject response = StandardResponse.standardErrorResponse(document, errorresponse, null);
        return response;
    }
    
    /** This is used to write a new collection (no overlaps) to a collection directory
     * 
     * @param event The transaction DatasetCollectionObjectSetManipulationTransaction
     * @param body The body of the document to register the writing of the elements.
     * @param set The set of objects to write
     * @param classname The classname of the objects to write
     * @param collectionset The DatasetSpecificationforSourceCollectionSet specification 
     */
    private static void writeWithNoCommonCatalogObjects(JsonObject event, Element body, JsonArray set, String classname, JsonObject collectionset) {
        Element div1 = body.addElement("div");
        div1.addText("Writing with no common elements in the collection set");
        JsonArray firestoreids = writeDatasetElements(body,set);
        body.addElement("div","Update Collection List");
        List<String> datasetIDs = getCatalogIDs(set);
        ManageDatasetDocumentLists.writeCollectionIDs(datasetIDs,classname,collectionset);
        JsonArray replaced = new JsonArray();
        event.add(ClassLabelConstants.DataCatalogOutputObjectReplaced, replaced);
        //event.add(ClassLabelConstants.DatabaseObjectIDOutputTransaction, firestoreids);
    }
    
    /** Extract list of CatalogObjectKey from JsonArray of catalog objects
     * 
     * @param set The JsonArray of catalog objects
     * @return The list of CatalogObjectKey ids
     * 
     * This extracts the ids from all the catalog objects and puts them in a list.
     */
    private static List<String> getCatalogIDs(JsonArray set) {
        List<String> ids = new ArrayList<String>(set.size());
        for (int i = 0; i < set.size(); i++) {
            JsonObject catalog = set.get(i).getAsJsonObject();
            ids.add(i,catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString());
        }
        return ids;
    }
    
    /** Write catalog objects of the same collection.
     * 
     * @param body The body of the document to register the writing of the elements.
     * @param set The set of catalog objects to write 
     * @return
     * 
     * This assumes that each of the catalog objects is of the same collection
     */
    private static JsonArray writeDatasetElements(Element body, JsonArray set) {
        getFirestoreID();
        JsonArray firestoreids = new JsonArray();
        Type type = new TypeToken<HashMap<String, Object>>() {
        }.getType();
        Element lst = body.addElement("ul");
        //db.runTransaction(transaction -> {
            for (int i = 0; i < set.size(); i++) {
                JsonObject catalog = set.get(i).getAsJsonObject();
                JsonObject destination = catalog.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
                firestoreids.add(destination);
                DocumentReference docrefdest = SetUpDocumentReference.setup(db, destination);
                Map<String, Object> destmapObj = new Gson().fromJson(catalog, type);
                docrefdest.set(destmapObj);
                //transaction.set(docrefdest, destmapObj);
                Element li = lst.addElement("li");
                li.addText("Write: " + catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString());
            }
            //return null;
        //});
         return firestoreids;
    }

    /** Delete a set of catalog ids (moves to the delete directory)
     * 
     * @param ids The list of catalog ids to delete
     * @param classname The classname of the objects to write
     * @param sourcecollection The DatasetSpecificationforSourceCollectionSet specification 
     * @param event The transaction DatasetCollectionObjectSetManipulationTransaction
     * @return The response of deleting
     */
    private static JsonObject deleteDatasetCatalogObjects(JsonArray ids, String classname, JsonObject sourcecollection, JsonObject event) {
        JsonObject info = new JsonObject();
        info.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
        info.add(ClassLabelConstants.SimpleCatalogName, ids);
        info.add(ClassLabelConstants.DatasetSpecificationforSourceCollectionSet, sourcecollection);        
        
        JsonObject deleteresponse = processDatasetCollectionSetObjectManagementDelete(event, info);
        
        return deleteresponse;
    }

    /** Create a JsonArray of the catalog ids (to be used in writing to a catalog object)
     * 
     * @param ids This is a list of strings (catalog ids)
     * @return The list as a JsonArray
     */
    public static JsonArray listOfStringsToJsonArray(List<String> ids) {
        JsonArray arr = new JsonArray();
        for(String id : ids) {
            arr.add(id);
        }
        return arr;
    }

}
