package info.esblurock.background.services.dataset;

import java.util.ArrayList;
import java.util.List;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.ManageDatasetCatalogObjects;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class ManageDatasetDocumentLists {
    static String indexID = "CatalogIDs";
    static String IDlabel = "IDs";

    /** Read in the IDs of the object collection
     * 
     * @param classname The classname of the catalog object to be referenced
     * @param recordid The DatasetSpecificationForCollectionSet address of the objects
     * @return The list of objects in the set
     * 
     * This reads in the list of objects.
     * 
     */
    public static ArrayList<String> getCollectionIDs(String classname, JsonObject recordid) {
        
        JsonObject firestoreid = FindDatasetCollections.findDatasetCollectionID(classname, recordid);
        return getCollectionIDsFromFirestoreID(firestoreid);
    }
    
    public static ArrayList<String> getCollectionIDsForClass(String classname) {
        JsonObject empty = CreateDocumentTemplate.createTemplate(classname);
        JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(empty);
        firestoreid.remove(ClassLabelConstants.SimpleCatalogName);   
         return getCollectionIDsFromFirestoreID(firestoreid);
         }
    
    /**
     * @param datasetIDs The list of object ids to write
     * @param classname The classname of the catalog object to be referenced
     * @param recordid The DatasetSpecificationForCollectionSet address of the objects
     * @return The response of the write.
     * 
     */
    public static String writeCollectionIDs(List<String> datasetIDs, String classname, JsonObject recordid) {
        JsonObject firestoreid = FindDatasetCollections.findDatasetCollectionID(classname, recordid);
        return writeCollectionIDs(datasetIDs,firestoreid);
    }
    
    public static ArrayList<String> getCollectionIDsFromFirestoreID(JsonObject firestoreid) {
        firestoreid.addProperty(ClassLabelConstants.SimpleCatalogName, indexID);
        JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(firestoreid);
        JsonArray IDarray = new JsonArray();
        if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonObject ids = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
            IDarray = ids.get(IDlabel).getAsJsonArray();
        } else {
            IDarray = new JsonArray();
        }
        ArrayList<String> IDs = new ArrayList<String>();
        for(int i = 0; i < IDarray.size(); i++){
            IDs.add(IDarray.get(i).getAsString());
        }
        
        return IDs;
    }
    
    /**
     * @param datasetIDs The list of object ids to write
     * @param firestoreid The firestore id of the collection
     * @return The response of the write.
     * 
     */
    public static String writeCollectionIDs(List<String> datasetIDs, JsonObject firestoreid) {
        firestoreid.addProperty(ClassLabelConstants.SimpleCatalogName, indexID);
        JsonObject ids = new JsonObject();
        ids.add(IDlabel, ManageDatasetCatalogObjects.listOfStringsToJsonArray(datasetIDs));
        ids.add(ClassLabelConstants.FirestoreCatalogID, firestoreid);
        return WriteFirestoreCatalogObject.writeCatalogObject(ids);        
    }
}
