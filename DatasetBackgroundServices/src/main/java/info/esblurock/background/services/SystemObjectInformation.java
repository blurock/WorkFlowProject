package info.esblurock.background.services;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;

public class SystemObjectInformation {

	public static String determineOwner() {
		return "Administrator";
	}

	public static String determineTransactionID() {
		return BaseCatalogData.generateUniqueUUID();
	}

	public static void fillInOwnerInformation(JsonObject catalog, String owner) {
		catalog.addProperty(ClassLabelConstants.CatalogObjectOwner, owner);
		catalog.addProperty(ClassLabelConstants.CatalogObjectAccessRead, owner);
		catalog.addProperty(ClassLabelConstants.CatalogObjectAccessModify, owner);
	}

}
