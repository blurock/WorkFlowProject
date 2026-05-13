package info.esblurock.reaction.core.ontology.base.transaction;

import com.google.gson.JsonObject;

import org.dom4j.Document;
import org.dom4j.Element;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

import com.google.gson.JsonArray;
import java.util.ArrayList;
import java.util.List;

public class GenerateOrderedListOfPrerequisites {

    public static JsonObject generate(JsonObject json) {
        Document document = MessageConstructor.startDocument("GenerateOrderedListOfPrerequisites");
        Element body = MessageConstructor.isolateBody(document);

        JsonObject result = new JsonObject();
        String transactionclass = json.get(ClassLabelConstants.TransactionID).getAsString();
        body.addElement("div").addText("GenerateOrderedListOfPrerequisites for " + transactionclass);
        List<String> prerequisites = generate(transactionclass, body);
        JsonArray prereqarray = new JsonArray();
        for (String prereq : prerequisites) {
            prereqarray.add(prereq);
        }
        result.addProperty(ClassLabelConstants.TransactionID, transactionclass);
        result.add(ClassLabelConstants.RequiredTransactionID, prereqarray);

        JsonArray arr = new JsonArray();
        arr.add(result);
        JsonObject response = StandardResponse.standardServiceResponse(document, transactionclass, arr);
        return response;
    }

    public static List<String> generate(String transactionclass, Element body) {
        List<String> result = new ArrayList<String>();
        addPrerequisites(result, transactionclass, body);
        return result;
    }

    private static void addPrerequisites(List<String> result, String transactionclass, Element body) {
        List<String> prerequisites = TransactionConceptParsing.requirementsOfTransaction(transactionclass);
        body.addElement("div").addText("Prerequisites for " + transactionclass + " are " + prerequisites.toString());
        for (String prereq : prerequisites) {
            if (!result.contains(prereq)) {
                result.add(0, prereq);
                addPrerequisites(result, prereq, body);
            }
        }

    }

}
