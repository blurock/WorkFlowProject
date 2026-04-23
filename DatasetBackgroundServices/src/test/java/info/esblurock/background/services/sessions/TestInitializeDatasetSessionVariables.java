package info.esblurock.background.services.sessions;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.background.services.dataset.InitializeDatasetSessionVariables;
import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.firestore.session.SessionDataManagement;

public class TestInitializeDatasetSessionVariables {

    @Test
    public void testGenerate() {
        InitiallizeSystem.initialize();
        JsonObject info = new JsonObject();
        JsonObject event = new JsonObject();
        String transactionclass = "dataset:TransactionInterpretBensonRule";
        info.addProperty(ClassLabelConstants.DescriptionTitle, "A descriptive title");
        info.addProperty(ClassLabelConstants.FileSourceFormat, "dataset:ThergasSpeciesThermodynamics");
        info.addProperty(ClassLabelConstants.UID, "UID");
        info.addProperty(ClassLabelConstants.SessionId, "SessionID");

        JsonObject minimalSessionDataObject = new JsonObject();
        minimalSessionDataObject.addProperty(AnnotationObjectsLabels.identifier, "dataset:sessiondata");
        minimalSessionDataObject.addProperty(ClassLabelConstants.UID, "UID");
        minimalSessionDataObject.addProperty(ClassLabelConstants.SessionId, "SessionID");
        info.add(ClassLabelConstants.SessionData, minimalSessionDataObject);
        try {
            System.out
                    .println("Minimal Session Data Object: " + JsonObjectUtilities.toString(minimalSessionDataObject));
            JsonObject body = new JsonObject();
            body.add(ClassLabelConstants.SessionData, minimalSessionDataObject);
            String sessionresponse = SessionDataManagement.updateSessionData(body);

            System.out.println("Wrote dummy Session: " + sessionresponse);
            System.out
                    .println("Minimal Session Data Object: " + JsonObjectUtilities.toString(minimalSessionDataObject));
            event.add(ClassLabelConstants.ShortDescription, body);
            System.out.println("-------------------------------------------------------");
            System.out.println("Info:" + JsonObjectUtilities.toString(info));
            System.out.println("-------------------------------------------------------");
            JsonObject response = InitializeDatasetSessionVariables.initialize(event, info);

            System.out.println("-------------------------------------------------------");
            System.out.println("InitializeDatasetSessionVariables for " + transactionclass);
            System.out.println(JsonObjectUtilities.toString(response));
            System.out.println("-------------------------------------------------------");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
