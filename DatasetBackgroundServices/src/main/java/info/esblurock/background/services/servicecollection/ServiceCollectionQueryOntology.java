package info.esblurock.background.services.servicecollection;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.classification.DatabaseOntologyClassification;
import info.esblurock.reaction.core.ontology.base.classification.GenerateSimpleClassification;
import info.esblurock.reaction.core.ontology.base.classification.TransactionEventHierarchy;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.SubstituteJsonValues;

/**
 * These services reflect the ontology definitions under
 * DatasetObjectManipulationService
 * 
 * @author edwardblurock
 *
 */
public enum ServiceCollectionQueryOntology {

	DatasetCreateObjectTemplate {

		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("DatasetCreateObjectTemplate");
			String catalogtype = json.get(ClassLabelConstants.DatabaseObjectType).getAsString();
			JsonObject catalog = CreateDocumentTemplate.createTemplate(catalogtype);
			JsonObject response = StandardResponse.standardServiceResponse(document,
					"Success: DatasetCreateObjectTemplate", catalog);
			return response;
		}

	},
	DatasetCollectionDocumentIDPairForHierarchy {
		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("DatasetCollectionDocumentIDPairForHierarchy");
			JsonObject catalog = json.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
			JsonObject catalogidset = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(catalog);
			JsonObject response = StandardResponse.standardServiceResponse(document,
					"Success: DatasetCollectionDocumentIDPairForHierarchy", catalogidset);
			return response;
		}

	},
	DatasetFillEmptyWithSourceInformation {

		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("DatasetCreateObjectTemplate");
			String catalogtype = json.get(ClassLabelConstants.DatabaseObjectType).getAsString();
			JsonObject source = json.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
			JsonObject catalog = CreateDocumentTemplate.createTemplate(catalogtype);
			String identifier = catalog.get(AnnotationObjectsLabels.identifier).getAsString();
			SubstituteJsonValues.substituteJsonObject(catalog, source);
			catalog.addProperty(AnnotationObjectsLabels.identifier, identifier);
			JsonObject response = StandardResponse.standardServiceResponse(document,
					"Success: DatasetCreateObjectTemplate", catalog);
			return response;
		}

	},
	DatasetCreateClassificationList {

		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("DatasetCreateClassificationList");
			String catalogtype = json.get(ClassLabelConstants.Classification).getAsString();
			JsonObject lst = GenerateSimpleClassification.generateSimpleListFromDataType(catalogtype);
			JsonObject response = StandardResponse.standardServiceResponse(document,
					"DatasetCreateClassificationList", lst);
			return response;
		}

	},
	DatasetCreateClassificationTree {

		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("DatasetCreateClassificationTree");
			String catalogtype = json.get(ClassLabelConstants.Classification).getAsString();
			JsonObject tree = DatabaseOntologyClassification.classificationTreeFromDataType(catalogtype);
			JsonObject response = StandardResponse.standardServiceResponse(document,
					"Success: DatasetCreateClassificationTree", tree);
			return response;
		}

	},
    DatasetCreateTransactionTree {

        @Override
        public JsonObject process(JsonObject json) {
            Document document = MessageConstructor.startDocument("DatasetCreateTransactionTree");
            JsonObject tree = null;
            if(json != null) {
                if(json.get(ClassLabelConstants.TransactionEvent) != null) {
                    String transaction = json.get(ClassLabelConstants.TransactionEvent).getAsString();
                    tree = TransactionEventHierarchy.generate(transaction);
                } else {
                    tree = TransactionEventHierarchy.generate();
                }                
            } else {
                tree = TransactionEventHierarchy.generate();
            }
            
            JsonObject response = StandardResponse.standardServiceResponse(document,
                    "Success: DatasetCreateTransactionTree", tree);
            return response;
        }

    };

	public abstract JsonObject process(JsonObject json);
}
