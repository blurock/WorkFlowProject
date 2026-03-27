package info.esblurock.background.services.dataset.catalog;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class ReadInSpecificDatasetCatalogObject {

    @Test
    public void test() {
        JsonObject json = new JsonObject();
        json.addProperty("service","ReadSpecificCatalogObjectInDataset");
        json.addProperty(ClassLabelConstants.CatalogObjectKey,"e2b94f9c-7e19-4da6-a4b3-eea417524c6c");
        json.addProperty(ClassLabelConstants.DatabaseObjectType,"dataset:RepositoryFileStaging");
        JsonObject jsontransspec = new JsonObject();
        String specid = "dataset:datasetfortypeincollection";
        json.add(specid,jsontransspec);
        jsontransspec.addProperty(ClassLabelConstants.CatalogDataObjectStatus,"");
        jsontransspec.addProperty(ClassLabelConstants.CollectionName,"Standard");
        jsontransspec.addProperty(ClassLabelConstants.DatasetVersion,"1.0");
        jsontransspec.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel,"tableA1CarbonBensonRules");
        jsontransspec.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer,"Administrator");
        
        System.out.println(JsonObjectUtilities.toString(json));
        JsonObject response = DatabaseServicesBase.process(json);
        JsonObjectUtilities.printResponse(response);
    }

}
