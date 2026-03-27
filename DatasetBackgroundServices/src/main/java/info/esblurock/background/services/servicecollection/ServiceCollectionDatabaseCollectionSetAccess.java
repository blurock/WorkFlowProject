package info.esblurock.background.services.servicecollection;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.DatasetCollectionIDManagement;
import info.esblurock.background.services.dataset.DatasetCollectionManagement;
import info.esblurock.background.services.dataset.FindDatasetCollections;
import info.esblurock.background.services.dataset.ReadInDatasetWithDatasetCollectionProcess;
import info.esblurock.background.services.dataset.examine.ProcessExamineDatabaseCollectionSetObject;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public enum ServiceCollectionDatabaseCollectionSetAccess {
    
    ExamineDatabaseCollectionSetObject {

        @Override
        public JsonObject process(JsonObject info) {
            JsonObject activity = info.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            return ProcessExamineDatabaseCollectionSetObject.process(activity);
        }
        
    },

   GetListOfDatasetCollectionIDsSet {

		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("GetListOfDatasetCollectionIDsSet");
			Element body = MessageConstructor.isolateBody(document);
			JsonObject collrecordid = json.get(ClassLabelConstants.DatasetCollectionSetRecordIDInfo).getAsJsonObject();
			String maintainer = collrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String collection = collrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
			body.addElement("div").addText("Find Collection " + collection + " from " + maintainer);
			JsonObject collids = DatasetCollectionManagement.getDatasetCollectionSets(collrecordid);
			JsonObject response = null;
			if (collids != null) {
				response = StandardResponse.standardServiceResponse(document, "Success read ", collids);
			} else {
				response = StandardResponse.standardErrorResponse(document, "Error: in reading ", null);
			}
			return response;
		}
	},
	ReadInDatasetWithDatasetCollection {

		@Override
		public JsonObject process(JsonObject json) {
		    /*
            Document document = MessageConstructor.startDocument("ReadInDatasetWithDatasetCollection");
            JsonObject idsset = json.get(ClassLabelConstants.ChemConnectDatasetCollectionIDsSet).getAsJsonObject();
            String classname = json.get(ClassLabelConstants.DatasetCollectionObjectType).getAsString();
            String dataset = idsset.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
            String maintainer = idsset.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            JsonObject criteria = null;
		    return ReadInDatasetWithDatasetCollectionProcess.process(maintainer, dataset, classname, criteria, document);
		    */
            Document document = MessageConstructor.startDocument("ReadInDatasetWithDatasetCollection");
            Element body = MessageConstructor.isolateBody(document);
            JsonObject idsset = json.get(ClassLabelConstants.ChemConnectDatasetCollectionIDsSet).getAsJsonObject();
            String classname = json.get(ClassLabelConstants.DatasetCollectionObjectType).getAsString();
            String label = idsset.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
            String maintainer = idsset.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            body.addElement("div").addText("Dataset  : " + label);
            body.addElement("div").addText("Maintainer: " + maintainer);
            body.addElement("div").addText("Classname: " + classname);
            String identifier = DatasetOntologyParseBase.getIDFromAnnotation(classname);
            JsonObject response = null;
            if (identifier != null) {
                if (idsset.get(identifier) != null) {
                    JsonObject collectioninfo = idsset.get(identifier).getAsJsonObject();
                    collectioninfo.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, label);
                    
                    //String catalogtype = OntologyUtilityRoutines.exactlyOnePropertySingle(classname, "dcat:catalog");
                    
                    JsonObject collectionid = DatasetCollectionIDManagement.firebaseIDOfCollection(classname,
                            collectioninfo);
                    JsonObject criteria = null;
                    if(json.get(ClassLabelConstants.SetOfPropertyValueQueryPairs) != null) {
                        criteria = json.get(ClassLabelConstants.SetOfPropertyValueQueryPairs).getAsJsonObject();
                    }
                    response = ReadFirestoreInformation.readFirestoreCollection(criteria, collectionid);
                    MessageConstructor.combineBodyIntoDocument(document, response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
                    if(response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                        response = StandardResponse.standardServiceResponse(document,
                                "Success in reading dataset collection", response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray());
                    } else {
                        response = StandardResponse.standardErrorResponse(document,
                                "Error in reading firestore collection", null);
                    }
                } else {
                    response = StandardResponse.standardErrorResponse(document,
                            classname + "(" + identifier + ")  not is dataset collection: " + label, null);
                }
            } else {
                response = StandardResponse.standardErrorResponse(document,
                        "Error: Identifer for " + classname + " not found", null);
            }
            return response;
     }

	}, ReadInDatasetWithDatasetCollectionLabel {
		@Override
		public JsonObject process(JsonObject json) {
		    JsonObject response = null;
		    try {
			Document document = MessageConstructor.startDocument("ReadInDatasetWithDatasetCollectionLabel");
			response = GetListOfDatasetCollectionIDsSet.process(json);
			if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				JsonObject collectionids = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
				
				json.add(ClassLabelConstants.ChemConnectDatasetCollectionIDsSet, collectionids);
				JsonObject readresponse = ReadInDatasetWithDatasetCollection.process(json);
				if (readresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
					String docS = readresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
					JsonArray objects = readresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
					MessageConstructor.combineBodyIntoDocument(document, docS);
					response = StandardResponse.standardServiceResponse(document, "Succcesful Read of objects",
							objects);
				} else {
				    
				    response = readresponse;
				}
			}
		    } catch(Exception ex) {
		        ex.printStackTrace();
		    }
			return response;
		}
	}, FindAllDatasetCollectionSets {

        @Override
        public JsonObject process(JsonObject json) {
            return FindDatasetCollections.findAllDatasetCollectionSets(json);
        }
	    
	};

	public abstract JsonObject process(JsonObject json);

}
