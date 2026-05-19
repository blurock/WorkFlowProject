package info.esblurock.background.services.dataset;

import java.util.Map;

import org.dom4j.Document;
import org.dom4j.Element;

import info.esblurock.background.services.firestore.session.SessionDataManagement;
import info.esblurock.reaction.core.MessageConstructor;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.StandardResponse;

public class ReadInDatasetTransaction {

    private static String transactioninfostring = """
                {
                'dataset:TransactionInterpretMolecularThermodynamics':  {
                    'dataset:catobjtype': 'dataset:JThermodynamics2DMoleculeThermodynamicsDataSet',
                    'dataset:filesourceformat': 'dataset:ThergasSpeciesThermodynamics'
                     },
                'dataset:TransactionInterpretSubstructureThermodynamics': {
                    'dataset:catobjtype': 'dataset:JThermodynamics2DSubstructureThermodynamicsDataSet',
                    'dataset:filesourceformat': 'dataset:TherGasSubstructureThermodynamics'
                     },
                'dataset:TransactionInterpretSymmetryInformation': {
                    'dataset:catobjtype': 'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet',
                    'dataset:filesourceformat': 'dataset:symmetrystructuredefinition'
                     },
                'dataset:TransactionInterpretMetaAtom': {
                    'dataset:catobjtype': 'dataset:JThermodynamicsMetaAtomDefinitionDataSet',
                    'dataset:filesourceformat': 'dataset:JThermodynamicsMetaAtomFormat'
                     },
                'dataset:TransactionInterpretDisassociationEnergy': {
                    'dataset:catobjtype': 'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet',
                    'dataset:filesourceformat': 'dataset:JThermodynamicsDisassociationEnergyFormat'
                     },
                'dataset:TransactionInterpretVibrationFrequency': {
                    'dataset:catobjtype': 'dataset:JThermodynamicsVibrationFrequencyDataSet',
                    'dataset:filesourceformat': 'dataset:JThermodynamicsVibrationalModes'
                     },
                'dataset:TransactionInterpretBensonRule': {
                    'dataset:catobjtype': 'dataset:ThermodynamicBensonRuleDefinitionDataSet',
                    'dataset:filesourceformat': 'dataset:TherGasBensonRules'
                     }


            }

            """;
    /*
     * The purpose of this class is to initialize the session variables for a
     * dataset transaction.
     * It reads the transaction type from the info object and then uses the
     * transactioninfostring to get the transaction information.
     * This adds:
     * TransactionEventType
     * DatasetObjectType
     * FileSourceFormat
     * DescriptionTitle
     * CatalogObjectUniqueGenericLabel
     * to the session data. the DatasetObjectType and FileSourceFormat are
     * determined by the TransactionEventType.
     */

    public static JsonObject process(JsonObject info) {
        Document document = MessageConstructor.startDocument("Initialize Dataset Session Variables");
        JsonObject response = null;
        try {
            JsonObject transactionformatinfo = JsonObjectUtilities.jsonObjectFromString(transactioninfostring);
            Element body = MessageConstructor.isolateBody(document);
            String transactiontype = info.get(ClassLabelConstants.TransactionEventDatasetCatalogObject).getAsString();
            body.addElement("div").addText("Transaction Type: " + transactiontype);
            JsonObject transactioninfo = transactionformatinfo.get(transactiontype).getAsJsonObject();
            if (transactioninfo == null) {
                return StandardResponse.standardServiceResponse(document,
                        "Error: Transaction type not found: " + transactiontype, info);
            }
            JsonObject minimalSessionData = SessionDataManagement.createSessionData(info, body);
            JsonObject sessiondataresponse = SessionDataManagement.readSessionData(minimalSessionData);
            JsonObject sessiondata = null;

            if (sessiondataresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                sessiondata = sessiondataresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
                if (sessiondata != null) {
                    sessiondata.addProperty(ClassLabelConstants.TransactionEventType, transactiontype);
                    sessiondata.addProperty(ClassLabelConstants.CatalogObjectType,
                            transactioninfo.get(ClassLabelConstants.CatalogObjectType).getAsString());
                    sessiondata.addProperty(ClassLabelConstants.FileSourceFormat,
                            transactioninfo.get(ClassLabelConstants.FileSourceFormat).getAsString());
                    sessiondata.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel,
                            info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString());

                    sessiondata.addProperty(ClassLabelConstants.DescriptionTitle,
                            info.get(ClassLabelConstants.DescriptionTitle).getAsString());
                    JsonObject updatebody = new JsonObject();
                    updatebody.add(ClassLabelConstants.SessionData, sessiondata);
                    String writeresponse = SessionDataManagement.updateSessionData(updatebody);
                    JsonArray arr = new JsonArray();
                    arr.add(sessiondata);
                    if (!writeresponse.startsWith("ERROR")) {
                        response = StandardResponse.standardServiceResponse(document,
                                "Session data initialized successfully", arr);
                    } else {
                        response = StandardResponse.standardErrorResponse(document,
                                "Error in writing session data: " + writeresponse, null);
                    }
                } else {
                    return StandardResponse.standardServiceResponse(document,
                            "Error: Session data not found (session null): "
                                    + info.get(ClassLabelConstants.SessionId).getAsString(),
                            null);
                }
            } else {
                response = StandardResponse.standardServiceResponse(document,
                        "Error: Session data not found (process unsuccessful): "
                                + info.get(ClassLabelConstants.SessionId).getAsString(),
                        null);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response = StandardResponse.standardServiceResponse(document, "Error: " + e.getMessage(), null);
        }
        return response;
    }
}
