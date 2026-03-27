package info.esblurock.background.services.dataset;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadCatalogTransactionObjectHierarchy {

    @Test
    public void test() {
        JsonObject json = new JsonObject();
        json.addProperty(DatabaseServicesBase.service, "ReadCatalogTransactionObjectHierarchy");
        json.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, "kFuG0gJor6otzMSWramHUnxCaxEQ");
        json.addProperty(ClassLabelConstants.TransactionEventType,"dataset:InitialReadInOfRepositoryFile");
         JsonObject response = DatabaseServicesBase.process(json);
        JsonObjectUtilities.printResponse(response);

    }

}
