package info.esblurock.background.services.utilities;

import static org.hamcrest.CoreMatchers.nullValue;

import org.apache.jena.sparql.function.library.substring;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import jnr.ffi.Struct.int16_t;

public enum CreateCatalogObjectElements {
	/*
	DataSetReference {
		@Override
		public JsonObject execute(JsonObject reference) {
			JsonObject element = CreateDocumentTemplate.createTemplate("dataset:BibliographicReferenceElement");
			element.add(ClassLabelConstants.DataSetReference, reference);
			element.addProperty(ClassLabelConstants.DOIElementReference, reference.get(ClassLabelConstants.DOI).getAsString());
			return element;
		}
		public JsonArray extractArrayOfObjects(JsonObject source) {
			return source.get(ClassLabelConstants.DataSetReference).getAsJsonArray();

		}
	},
*/
	ObjectSiteReference {
		@Override
		public JsonObject execute(JsonObject source) {
			JsonObject element = CreateDocumentTemplate.createTemplate("dataset:ObjectSiteReferenceElement");
			return null;
		}
		public JsonArray extractArrayOfObjects(JsonObject source) {
			return source.get(ClassLabelConstants.ObjectSiteReference).getAsJsonArray();

		}
	},
	PersonNameCatalogElement {
		@Override
		public JsonObject execute(JsonObject source) {
			JsonObject element = CreateDocumentTemplate.createTemplate("dataset:PersonNameCatalogElement");
			element.add(ClassLabelConstants.NameOfPerson, source);
			element.addProperty(ClassLabelConstants.PersonFullName, source.get(ClassLabelConstants.PersonFullName).getAsString());
			return element;
		}

		/*
		 * The PersonNameCatalogElement is extracted from a PersonDescription within DatabasePerson (the source).
		 * (DataSetReference).
		 */
		public JsonArray extractArrayOfObjects(JsonObject source) {
			JsonObject persondescriptionJsonObject = source.get(ClassLabelConstants.PersonalDescription).getAsJsonObject();
			JsonObject name = persondescriptionJsonObject.get(ClassLabelConstants.NameOfPerson).getAsJsonObject();
			JsonArray nameArray = new JsonArray();
			nameArray.add(name);
			return nameArray;

		}
	},
	AuthorInformation {
		@Override
		public JsonObject execute(JsonObject source) {
			JsonObject authorJsonObject = CreateDocumentTemplate.createTemplate("dataset:AuthorInformation");
			authorJsonObject.addProperty(ClassLabelConstants.familyName, source.get(ClassLabelConstants.AuthorFamilyName).getAsString());
			authorJsonObject.addProperty(ClassLabelConstants.givenName, source.get(ClassLabelConstants.AuthorGivenName).getAsString());
			authorJsonObject.addProperty(ClassLabelConstants.UserTitle, source.get(ClassLabelConstants.AuthorNameTitle).getAsString());
			authorJsonObject.addProperty(ClassLabelConstants.PersonFullName, source.get(ClassLabelConstants.PersonFullName).getAsString());
			
			return PersonNameCatalogElement.execute(authorJsonObject);
		}

		/*
		 * The AuthorInformation is extracted from a bibliographic reference (DataSetReference).
		 */
		public JsonArray extractArrayOfObjects(JsonObject source) {
			return source.get(ClassLabelConstants.AuthorInformation).getAsJsonArray();

		}
	};
	
	
	abstract JsonObject execute(JsonObject input);
	abstract JsonArray extractArrayOfObjects(JsonObject source);
	
	public static JsonObject makeElements(String type, JsonObject source) {
		CreateCatalogObjectElements process = CreateCatalogObjectElements.valueOf(type.substring(8));
		JsonArray array = process.extractArrayOfObjects(source);
		JsonArray resultArray = new JsonArray();
		for (int i = 0; i < array.size(); i++) {
			JsonObject element = array.get(i).getAsJsonObject();
			JsonObject result = process.execute(element);
			resultArray.add(result);
		}
		return null;
	}
	
	public static String WriteElement(JsonObject element) {
		String messageString = "";
		try {
			messageString = WriteFirestoreCatalogObject.writeCatalogObjectWithException(element);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return messageString;
	}

}
