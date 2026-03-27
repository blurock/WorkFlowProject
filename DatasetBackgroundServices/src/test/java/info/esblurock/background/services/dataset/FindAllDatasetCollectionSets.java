package info.esblurock.background.services.dataset;


import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FindAllDatasetCollectionSets {

    @Test
    public void testFindAllDatasetCollectionSets() {
        JsonObject json = new JsonObject();
        String owner = "kFuG0gJor6otzMSWramHUnxCaxEQ";
        
        json.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, owner);
        json.addProperty(DatabaseServicesBase.service, "FindAllDatasetCollectionSets");
        JsonObject response = DatabaseServicesBase.process(json);
        JsonObjectUtilities.printResponse(response);
        
    }

}
