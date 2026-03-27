package info.esblurock.background.services.servicecollection;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestGetListOfDatasetCollectionIDsSet {

    @Test
    public void test() {
        System.out.println("-----------------------------------------------------");
        System.out.println("GetListOfDatasetCollectionIDsSet: get all collections");
        System.out.println("-----------------------------------------------------");

        String collectionlabel = "StandardData";
        JsonObject json = new JsonObject();

        JsonObject collrecordid = new JsonObject();
        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, collrecordid);
        collrecordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, collectionlabel);
        collrecordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, "Administrator");
        json.addProperty(DatabaseServicesBase.service, "GetListOfDatasetCollectionIDsSet");
        JsonObject response = DatabaseServicesBase.process(json);
        JsonObjectUtilities.printResponse(response);

    }

}
