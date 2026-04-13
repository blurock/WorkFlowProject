package info.esblurock.background.services.servicecollection;

import org.junit.Test;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestServiceCollectionQuery {

    @Test
    public void testFindActivityInformationClassForTransaction() {
        System.out.println("---------------------------------------------------------------");
        System.out.println("Testing FindActivityInformationClassForTransaction");
        System.out.println("---------------------------------------------------------------");

        JsonObject json = new JsonObject();
        // The constant for "dataset:transaction" is ClassLabelConstants.TransactionEvent
        json.addProperty(ClassLabelConstants.TransactionEvent, "dataset:InitialReadInLocalStorageSystem");
        
        System.out.println("Input JSON: " + JsonObjectUtilities.toString(json));

        try {
            JsonObject response = ServiceCollectionQueryOntology.FindActivityInformationClassForTransaction.process(json);
            JsonObjectUtilities.printResponse(response);
        } catch (Exception e) {
            System.err.println("Error during ontology query: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
