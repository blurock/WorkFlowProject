package info.esblurock.background.services.jthermodynamics.structcorrections;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FindJThermodynamics2DSubstructureThermodynamics {
    
    /** Read in JThermodynamics2DSubstructureThermodynamics objects of specified structuretype
     * 
     * @param maintainer: The maintainer (owner) of the objects
     * @param dataset The dataset collection name
     * @param structuretype The type of substructure to be fetched (JThermodynamicsSubstructureType)
     * @return response of reading the objects in the collection
     * 
     * The collection is determined by the maintainer and the dataset.
     * The structuretype is one of JThermodynamicsSubstructureType choices
     * The collection is read with the additional property of JThermodynamicsSubstructureType species
     * 
     * This routine sets up a call to the service 'ReadInDatasetWithDatasetCollectionLabel'
     */
    public static JsonObject findJThermodynamics2DSubstructureThermodynamics(String maintainer, String dataset, String structuretype) {
        JsonObject setofprops = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
        JsonArray arr = new JsonArray();
        setofprops.add(ClassLabelConstants.PropertyValueQueryPair, arr);
        JsonObject prop = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
        prop.addProperty(ClassLabelConstants.DatabaseObjectType, ClassLabelConstants.JThermodynamicsSubstructureType);
        prop.addProperty(ClassLabelConstants.ShortStringKey, structuretype);
        arr.add(prop);
        return findJThermodynamics2DSubstructureThermodynamicsDefinitions(maintainer, dataset, setofprops);
    }

    /**  Read in JThermodynamics2DSubstructureThermodynamics objects of specified properties
     * @param maintainer: The maintainer (owner) of the objects
     * @param dataset The dataset collection name
     * @param setofproperties The set of properties required of the objects in the collection
     * @return response of reading the objects in the collection
     * 
     * This sets up a call to ReadInDatasetWithDatasetCollectionLabel
     * 
     */
    private static JsonObject findJThermodynamics2DSubstructureThermodynamicsDefinitions(String maintainer, String dataset, JsonObject setofproperties) {
        String classname = "dataset:JThermodynamics2DSubstructureThermodynamics";
        String service = "ReadInDatasetWithDatasetCollectionLabel";
        JsonObject json = new JsonObject();
        JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
        if (setofproperties != null) {
            json.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, setofproperties);
        }
        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
        json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
        json.addProperty(DatabaseServicesBase.service, service);
        JsonObject response = DatabaseServicesBase.process(json);
        
        
        return response;

    }


}
