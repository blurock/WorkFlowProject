package info.esblurock.reaction.core.ontology.base.collectionset;

import java.util.Iterator;
import java.util.List;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class CollectionSetUtilities {
    
    /** Get list of dataset collections information from the collection type name.
     * 
     * @return JsonArray of dataset collection information as JsonObject
     * 
     * The direct subclasses of dataset:ChemConnectDatasetCollection
     * 
     * The JsonArray has the annotation information for each collection (for use in a pull down list)
     */
    public static JsonArray listOfCollectionDatasets() {
        JsonArray collections = new JsonArray();
        List<String> names = GenericSimpleQueries.listOfSubClasses("dataset:ChemConnectDatasetCollection", true);
        for(String name : names) {
            BaseAnnotationObjects annotations = DatasetOntologyParseBase.getAnnotationStructureFromIDObject(name);
            JsonObject json = annotations.toJsonObject();
            collections.add(json);
        }
        return collections;
    }
    
    /** The set of collection dataset information
     * 
     * @param collection The name of the dataset collection
     * @return JsonArray of information for each dataset
     * 
     * The dataset information is annotated with the associated catalog name.
     * 
     */
    public static JsonArray collectionDatasetInfo(String collection) {
        JsonArray datasets = new JsonArray();
        collectionDatasetInfo(collection,datasets);
        return datasets;
    }
        
    private static void collectionDatasetInfo(String collection, JsonArray datasets) {
        List<String> names = GenericSimpleQueries.listOfSubClasses(collection, false);
        for(String name : names) {
            JsonObject json = createcCollectionDatasetInfoElement(name);
            datasets.add(json);
            //collectionDatasetInfo(name,datasets);
        }
    }
    
    private static JsonObject createcCollectionDatasetInfoElement(String name) {
        BaseAnnotationObjects annotations = DatasetOntologyParseBase.getAnnotationStructureFromIDObject(name);
        JsonObject json = annotations.toJsonObject();
        String catalog = OntologyUtilityRoutines.exactlyOnePropertySingle(name, OntologyObjectLabels.catalog);
        json.addProperty(OntologyObjectLabels.catalog, catalog);
        return json;
    }
    
    /** Identifier of dataset id for a given catalog object
     * 
     * @param catalogname: The name of the catalog object associated with the dataset
     * @param collectiondatasetinfo: The JsonArray of the dataset information
     * @return The identifier to be used within the collectiondatasetIDs (null if not found)
     * 
     */
    public static String datasetIdentifierInDatasetIDs(String catalogname, JsonArray collectiondatasetinfo) {
        String identifier = null;
        Iterator<JsonElement> iter = collectiondatasetinfo.iterator();
        while(identifier == null && iter.hasNext()) {
            JsonObject dataset = (JsonObject) iter.next();
            if(dataset.get(OntologyObjectLabels.catalog).getAsString().equals(catalogname)) {
                identifier = dataset.get(AnnotationObjectsLabels.identifier).getAsString();
            }
        }
        return identifier;
    }

}
