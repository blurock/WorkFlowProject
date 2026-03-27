package info.esblurock.background.services.transaction;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindTransactionFromActivityInfo {

    @Test
    public void test() {
       String infoS = "{\n"
                + " \"prov:activity\": \"dataset:InitialReadInOfRepositoryFile\",\n"
                + " \"dataset:datasettransactionspecification\": {\n"
                + "     \"dataset:catalogobjectmaintainer\": \"Administrator\",\n"
                + "     \"dataset:datasetname\": \"StandardData\",\n"
                + "     \"dataset:datasetversion\": \"1.0\",\n"
                + "     \"dataset:uniquegenericname\": \"tableA1CarbonBensonRules\"\n"
                + " }\n"
                + "}";
        JsonObject info = JsonObjectUtilities.jsonObjectFromString(infoS);
        System.out.println("--------------- FindTransactionFromActivityInfo.findTransaction -----------");
        String type = "dataset:InitialReadInOfRepositoryFile";
        JsonObject emptycatalog = FindTransactionFromActivityInfo.findTransaction(type, info);
        System.out.println(JsonObjectUtilities.toString(emptycatalog));
        if (emptycatalog != null) {
            System.out.println("--------------- CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate -----------");
            JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(emptycatalog);
            firestoreid.remove(ClassLabelConstants.SimpleCatalogName);
            System.out.println(JsonObjectUtilities.toString(firestoreid));
            JsonObject setofprops = FindTransactionFromActivityInfo.determineSetOfProps(type,info);
            System.out.println("--------------- FindTransactionFromActivityInfo.determineSetOfProps -----------");
            System.out.println(JsonObjectUtilities.toString(setofprops));
        } else {
            System.out.println("Empty");
        }
    }

}
