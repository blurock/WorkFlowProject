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
			transaction.addProperty(ClassLabelConstants.CatalogObjectOwner,
					info.get(ClassLabelConstants.CatalogObjectOwner).getAsString());
			transaction.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel,
					info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString());
			transaction.addProperty(ClassLabelConstants.DatabaseObjectType,
					info.get(ClassLabelConstants.DatabaseObjectType).getAsString());
			BaseCatalogData.insertFirestoreAddress(transaction);

		}

		@Override
		JsonObject createSetOfProperties(JsonObject info) {
			// String datasetid =
			// info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			// String owner =
			// info.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			// String type = info.get(ClassLabelConstants.CatalogObjectType).getAsString();
			JsonObject setofprops = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
			JsonArray props = new JsonArray();
			setofprops.add(ClassLabelConstants.PropertyValueQueryPair, props);
			/*
			 * String prefix = ClassLabelConstants.ActivityInformationRecord + ".";
			 * 
			 * JsonObject prop1 =
			 * CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
			 * prop1.addProperty(ClassLabelConstants.DatabaseObjectType,
			 * prefix + ClassLabelConstants.CatalogObjectUniqueGenericLabel);
			 * prop1.addProperty(ClassLabelConstants.ShortStringKey, datasetid);
			 * props.add(prop1);
			 * 
			 * JsonObject prop2 =
			 * CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
			 * prop2.addProperty(ClassLabelConstants.DatabaseObjectType, prefix +
			 * ClassLabelConstants.CatalogObjectOwner);
			 * prop2.addProperty(ClassLabelConstants.ShortStringKey, owner);
			 * props.add(prop2);
			 * 
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

	public static JsonObject findTransaction(String transactiontype, JsonObject info) {
		JsonObject transaction = null;
		String transactionobjectname = "";
		String name = "";

		TransactionProcess process = TransactionProcess.valueOf(transactiontype.substring(8));
		transactionobjectname = process.transactionObjectName();
		name = transactionobjectname.substring(8);
		FindTransactionFromActivityInfo fill = FindTransactionFromActivityInfo.valueOf(name);
		if (fill != null) {
			transaction = CreateDocumentTemplate.createTemplate(transactionobjectname);
			transaction.add(ClassLabelConstants.ActivityInformationRecord, info);
			JsonObject shortdescr = transaction.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			shortdescr.addProperty(ClassLabelConstants.TransactionEventType, transactiontype);
			fill.fill(info, transaction);
		} else {
			System.out.println("findTransaction fill: not found: '" + name + "'");
		}
		return transaction;
	}

	public static JsonObject determineSetOfProps(String transactiontype, JsonObject info) {
		TransactionProcess process = TransactionProcess.valueOf(transactiontype.substring(8));
		String transactionobjectname = process.transactionObjectName();
		String name = transactionobjectname.substring(8);
		FindTransactionFromActivityInfo fill = FindTransactionFromActivityInfo.valueOf(name);
		JsonObject setofprops = null;
		if (fill != null) {
			setofprops = fill.createSetOfProperties(info);
		}
		return setofprops;
	}

}
