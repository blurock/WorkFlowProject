package info.esblurock.reaction.core.ontology.base.hierarchy;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

/** Generate string label from the classname and the JsonObject
 * 
 * @author edwardblurock
 * 
 * given the classname and the object in JsonObject form, generate a label.
 * The label is determined by the subclass of dataset:SimpleCatalogName
 *
 */

public enum GenerateStringLabel {
	
    LabelDerivedFromDatasetCollectionObjectType {

        @Override
        String deriveName(String hierclass, String classname, JsonObject object) {
            String label = ClassLabelConstants.DatasetCollectionObjectType;
            String id = object.get(ClassLabelConstants.DatabaseObjectType).getAsString();
            return getValueFromObject(object,label,id);
        }
        
    },
    LabelDerivedFromDatasetObjectType {

        @Override
        String deriveName(String hierclass, String classname, JsonObject object) {
            String label = ClassLabelConstants.DatasetObjectType;
            String id = object.get(ClassLabelConstants.DatabaseObjectType).getAsString();
            return getValueFromObject(object,label,id);
        }
        
    },
    LabelDerivedFromTransactionEventType {

		@Override
		String deriveName(String hierclass, String classname, JsonObject object) {
			String label = ClassLabelConstants.TransactionEventType;
			String id = object.get(ClassLabelConstants.DatabaseObjectType).getAsString();
			return getValueFromObject(object,label,id);
		}
		
	},
	
	LabelDerivedFromCollectionIDSetLabel {

		@Override
		String deriveName(String hierclass, String classname, JsonObject object) {
			String label = ClassLabelConstants.DatasetCollectionsSetLabel;
			String defaultlabel = "default";
			return getValueFromObject(object,label,defaultlabel);
		}
		
	},	LabelDerivedFromDatasetLabel {

		@Override
		String deriveName(String hierclass, String classname, JsonObject object) {
			String label = ClassLabelConstants.CollectionName;
			String owner = object.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			return getValueFromObject(object,label,owner);
		}
		
	},
	LabelDerivedFromObjectStatus {

		@Override
		String deriveName(String hierclass, String classname, JsonObject object) {
			String label = ClassLabelConstants.CatalogDataObjectStatus;
			return getValueFromObject(object,label,"CatalogObjectStatusCurrent");
		}
		
	},
	LabelDerivedFromDatasetVersion {

		@Override
		String deriveName(String hierclass, String classname, JsonObject object) {
			String label = ClassLabelConstants.DatasetVersion;
			Date currentTime = Calendar.getInstance().getTime();
			SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMdd");
			String formattedDate = formatter.format(currentTime);
			return getValueFromObject(object,label,formattedDate);
		}
		
	},
	LabelDerivedFromObjectUniqueLabel {

		@Override
		String deriveName(String hierclass, String classname, JsonObject object) {
			String label = ClassLabelConstants.CatalogObjectUniqueGenericLabel;
			String id = object.get(ClassLabelConstants.CatalogObjectKey).getAsString();
			return getValueFromObject(object,label,id);
		}
		
	}, LabelDerivedFromMaintainerLabel {

		@Override
		String deriveName(String hierclass, String classname, JsonObject object) {
			String label = ClassLabelConstants.CatalogDataObjectMaintainer;
			String owner = object.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			return getValueFromObject(object,label,owner);
		}
		
	}, DerivedFromObjectClassName {

		@Override
		String deriveName(String hierclass,String classname, JsonObject object) {
			String name = classname.substring(8);
			return name;
		}
		
	}, DerivedFromHierarchyClassAnnotationAltLabel {

		@Override
		String deriveName(String hierclass,String classname, JsonObject object) {
			String name = DatasetOntologyParseBase.getAltLabelFromAnnotation(hierclass);
			return name;
		}
		
	}, DerivedFromCurrentClassAnnotationAltLabel {

		@Override
		String deriveName(String hierclass,String classname, JsonObject object) {
			String name = DatasetOntologyParseBase.getAltLabelFromAnnotation(classname);
			return name;
		}
		
	}, LabelDerivedFromRDFTriplet {

		@Override
		String deriveName(String hierclass,String classname, JsonObject object) {
			return null;
		}
		
	}, LabelDerivedFromCatalogObjectKey {

		@Override
		String deriveName(String hierclass,String classname, JsonObject object) {
			String name = JsonObjectUtilities.getValueUsingIdentifier(object, ClassLabelConstants.CatalogObjectKey);
			return name;
		}
		
	}, LabelDerivedFromCatalogOwner {

		@Override
		String deriveName(String hierclass,String classname, JsonObject object) {
			String name = JsonObjectUtilities.getValueUsingIdentifier(object, ClassLabelConstants.CatalogObjectOwner);
			return name;
		}
		
	};
	
	private static String getValueFromObject(JsonObject object, String identifier, String defaultvalue) {
		String lbl = defaultvalue;
		JsonArray objectarr = JsonObjectUtilities.getValueUsingIdentifierMultiple(object,identifier);
		if(objectarr.size() > 0) {
			lbl = objectarr.get(0).getAsString();
			int position = lbl.indexOf(":");
			if(position > 0) {
				lbl = lbl.substring(position+1);
			}
		}
		return lbl;
	}
	
	/** Derive the label from classname and object in JsonObject form
	 * 
	 * @param classname The name of the class of the object
	 * @param object The object in JsonObject format
	 * @return The derived string label
	 * 
	 */
	abstract String deriveName(String hierclass, String classname, JsonObject object);

}
