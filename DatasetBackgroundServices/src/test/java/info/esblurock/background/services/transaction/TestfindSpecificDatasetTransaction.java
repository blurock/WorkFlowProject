package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestfindSpecificDatasetTransaction {

    @Test
    public void test() {
        InitiallizeSystem .initialize();
        String infoS = "{\n"
                + "    \"prov:activity\": \"dataset:InitialReadInOfRepositoryFile\",\n"
                + "     \"dataset:datasettransactionspecification\": {\n"
                + "            \"dataset:catalogobjectmaintainer\": \"Administrator\",\n"
                + "            \"dataset:datasetname\": \"Standard\",\n"
                + "            \"dataset:datasetversion\": \"1.0\",\n"
                + "            \"dataset:uniquegenericname\": \"tableA1CarbonBensonRules\"\n"
                + "        }\n"
                + "}";
        System.out.println(infoS);
        JsonObject info = JsonObjectUtilities.jsonObjectFromString(infoS);
        String type = "dataset:InitialReadInOfRepositoryFile";
        System.out.println("--------------- FindTransactionFromActivityInfo.findTransaction -----------");
        String ID = "7b3e9241-8add-4054-a14d-794dd56b7f57";
        //String ID = "xxx1bc8cc70-12c0-40ee-ae8a-9604b204e0f6";
        JsonObject reponse = FindTransactions.findSpecificDatasetTransaction(info, type, ID);
        JsonObjectUtilities.printResponse(reponse);
    }

}
