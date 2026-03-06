package info.esblurock.reaction.core.ontology.base.dataset;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;

import info.esblurock.reaction.core.ontology.base.collectionset.CollectionSetUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCollectionSertUtilities {

    @Test
    public void testListOfCollectionDatasets() {
        System.out.println("-----------------------------------------------------------");
        System.out.println("testListOfCollectionDatasets");
        JsonArray collections = CollectionSetUtilities.listOfCollectionDatasets();
        System.out.println(JsonObjectUtilities.toString(collections));
        
        System.out.println("-----------------------------------------------------------");
        
    }

    @Test
    public void testCollectionDatasetInfo() {
        System.out.println("-----------------------------------------------------------");
        System.out.println("testCollectionDatasetInfo()");
        JsonArray datasets = CollectionSetUtilities.collectionDatasetInfo("dataset:ThermodynamicDatasetCollection");
        System.out.println(JsonObjectUtilities.toString(datasets));
       System.out.println("-----------------------------------------------------------");
    }

    @Test
    public void testDatasetIdentifierInDatasetIDs() {
        System.out.println("-----------------------------------------------------------");
        System.out.println("testDatasetIdentifierInDatasetIDs()");
        JsonArray datasets = CollectionSetUtilities.collectionDatasetInfo("dataset:ThermodynamicDatasetCollection");
        String catalogname = "dataset:ThermodynamicBensonRuleDefinition";
        String identifier = CollectionSetUtilities.datasetIdentifierInDatasetIDs(catalogname, datasets);
        System.out.println("Catalog name: " + catalogname + "  Identifier in dataset: '" + identifier + "'");
        
        System.out.println("-----------------------------------------------------------");
    }

}
