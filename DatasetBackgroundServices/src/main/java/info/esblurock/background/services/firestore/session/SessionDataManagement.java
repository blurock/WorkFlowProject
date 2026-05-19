package info.esblurock.background.services.firestore.session;

import com.google.gson.JsonObject;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import org.dom4j.Element;

public class SessionDataManagement {

    public static JsonObject createSessionData(JsonObject info, Element body) {
        body.addElement("div").addText("UID: " + info.get(ClassLabelConstants.UID).getAsString());
        body.addElement("div").addText("Session ID: " + info.get(ClassLabelConstants.SessionId).getAsString());
        JsonObject minimalSessionData = new JsonObject();
        minimalSessionData.addProperty(AnnotationObjectsLabels.identifier,
                ClassLabelConstants.SessionData);
        minimalSessionData.addProperty(ClassLabelConstants.SessionId,
                info.get(ClassLabelConstants.SessionId).getAsString());
        minimalSessionData.addProperty(ClassLabelConstants.UID, info.get(ClassLabelConstants.UID).getAsString());
        return minimalSessionData;
    }

    /**
     * Reads the SessionData from Firestore using a minimal SessionData object
     * containing the essential address information.
     *
     * @param minimalSessionData A minimal JSON object describing the SessionData
     *                           (requires UID, DateCreated, SessionId, etc.)
     *                           used to derive its address.
     * @return The complete SessionData object retrieved from Firestore.
     */
    public static JsonObject readSessionData(JsonObject minimalSessionData) {
        // Find the address of the catalog object
        JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(minimalSessionData);
        // Read the catalog object from Firestore
        JsonObject sessionData = ReadFirestoreInformation.readFirestoreCatalogObject(firestoreid);

        return sessionData;
    }

    /**
     * Updates/Writes the full current SessionData to Firestore.
     *
     * @param fullSessionData The complete current SessionData JSON object to be
     *                        updated.
     * @return A status message indicating the outcome of the write operation.
     */
    public static String updateSessionData(JsonObject body) {
        JsonObject sessionData = body.get(ClassLabelConstants.SessionData).getAsJsonObject();
        // Determine whether the object has a FirestoreCatalogID property
        if (!sessionData.has(ClassLabelConstants.FirestoreCatalogID)) {
            // If not, generate one using searchForCatalogObjectInHierarchyTemplate
            JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(sessionData);

            // Insert the generated ID into the object
            sessionData.add(ClassLabelConstants.FirestoreCatalogID, firestoreid);
        }

        // Write the object to Firestore
        String responseMessage = WriteFirestoreCatalogObject.writeCatalogObject(sessionData);

        return responseMessage;
    }
}
