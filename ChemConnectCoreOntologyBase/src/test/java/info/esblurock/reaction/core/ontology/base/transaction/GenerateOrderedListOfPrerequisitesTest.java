package info.esblurock.reaction.core.ontology.base.transaction;

import org.junit.Test;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class GenerateOrderedListOfPrerequisitesTest {

    @Test
    public void testGenerate() {
        JsonObject input = new JsonObject();
        String transactionclass = "dataset:TransactionInterpretBensonRule";
        input.addProperty(ClassLabelConstants.TransactionEventType, transactionclass);

        JsonObject response = GenerateOrderedListOfPrerequisites.generate(input);

        System.out.println("-------------------------------------------------------");
        System.out.println("GenerateOrderedListOfPrerequisites for " + transactionclass);
        System.out.println(JsonObjectUtilities.toString(response));
        System.out.println("-------------------------------------------------------");
    }
}
