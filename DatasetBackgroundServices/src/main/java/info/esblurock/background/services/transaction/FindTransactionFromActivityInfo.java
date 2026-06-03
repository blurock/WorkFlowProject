package info.esblurock.background.services.transaction;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;

public enum FindTransactionFromActivityInfo {

	DatasetTransactionEventObject {

		@Override
		void fill(JsonObject info, JsonObject transaction) {
			String owner = info.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			String type = info.get(ClassLabelConstants.TransactionEventType).getAsString();
			JsonObject descr = transaction.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			descr.addProperty(ClassLabelConstants.TransactionEventType, type);
			transaction.addProperty(ClassLabelConstants.CatalogObjectOwner, owner);
			BaseCatalogData.insertFirestoreAddress(transaction);
		}

		@Override
		JsonObject createSetOfProperties(JsonObject info) {
			JsonObject activity = info;
			if (info.get(ClassLabelConstants.ActivityInformationRecord) != null) {
				activity = info.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
			}

			String datasetid = activity.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			// String owner =
			// info.get(ClassLabelConstants.CatalogObjectOwner).getAsString();

			JsonObject setofprops = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
			JsonArray props = new JsonArray();
			setofprops.add(ClassLabelConstants.PropertyValueQueryPair, props);

			String prefix = ClassLabelConstants.ActivityInformationRecord + ".";

			JsonObject prop1 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
			prop1.addProperty(ClassLabelConstants.DatabaseObjectType,
					prefix + ClassLabelConstants.CatalogObjectUniqueGenericLabel);
			prop1.addProperty(ClassLabelConstants.ShortStringKey, datasetid);
			props.add(prop1);

			/*
			 * JsonObject prop2 =
			 * CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
			 * prop2.addProperty(ClassLabelConstants.DatabaseObjectType, prefix +
			 * ClassLabelConstants.CatalogObjectOwner);
			 * prop2.addProperty(ClassLabelConstants.ShortStringKey, owner);
			 * props.add(prop2);
			 */
			/*
			 * JsonObject prop3 =
			 * CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
			 * prop3.addProperty(ClassLabelConstants.DatabaseObjectType, prefix +
			 * ClassLabelConstants.DatasetObjectType);
			 * prop3.addProperty(ClassLabelConstants.ShortStringKey, type);
			 * props.add(prop3);
			 */

			return setofprops;
		}

	},
	DatasetCollectionManagementTransaction {

		@Override
		void fill(JsonObject info, JsonObject transaction) {
			JsonObject recordid = info.get(ClassLabelConstants.DatasetCollectionSetRecordIDInfo).getAsJsonObject();
			transaction.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
		}

		@Override
		JsonObject createSetOfProperties(JsonObject info) {
			return null;
		}

	};

	abstract void fill(JsonObject info, JsonObject transaction);

	abstract JsonObject createSetOfProperties(JsonObject info);

	/*
	 * info has the structure:
	 * set of properties for a general transaction object
	 * ActivityInformationRecord: properties specific to each transaction type
	 * 
	 * The findTransaction method creates a transaction object and fills in the
	 * ActivityInformationRecord with the properties from the info object.
	 * 
	 */

	public static JsonObject findTransaction(String transactiontype, JsonObject info) {
		JsonObject transaction = null;
		String transactionobjectname = "";
		String name = "";
		JsonObject activity = info.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
		TransactionProcess process = TransactionProcess.valueOf(transactiontype.substring(8));
		transactionobjectname = process.transactionObjectName();
		name = transactionobjectname.substring(8);
		FindTransactionFromActivityInfo fill = FindTransactionFromActivityInfo.valueOf(name);
		if (fill != null) {
			transaction = CreateDocumentTemplate.createTemplate(transactionobjectname);
			transaction.add(ClassLabelConstants.ActivityInformationRecord, activity);
			JsonObject shortdescr = transaction.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			shortdescr.addProperty(ClassLabelConstants.TransactionEventType, transactiontype);
			fill.fill(info, transaction);
		} else {
			System.out.println("findTransaction fill: not found: '" + name + "'");
		}
		return transaction;
	}

	/*
	 * These are properties within the transaction object
	 * They are used to search for the transaction object in the hierarchy.
	 * 
	 * The transaction is used to find the collection, and these properties are used
	 * to find the individual object
	 * within the collection.
	 */
	public static JsonObject determineSetOfProps(String transactiontype, JsonObject activity) {
		TransactionProcess process = TransactionProcess.valueOf(transactiontype.substring(8));
		String transactionobjectname = process.transactionObjectName();
		String name = transactionobjectname.substring(8);
		FindTransactionFromActivityInfo fill = FindTransactionFromActivityInfo.valueOf(name);
		JsonObject setofprops = null;
		if (fill != null) {
			setofprops = fill.createSetOfProperties(activity);
		}
		return setofprops;
	}

}
