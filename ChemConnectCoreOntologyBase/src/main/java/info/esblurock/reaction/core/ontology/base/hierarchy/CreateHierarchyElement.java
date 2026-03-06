package info.esblurock.reaction.core.ontology.base.hierarchy;

import java.util.Iterator;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.classification.ClassificationHierarchy;
import info.esblurock.reaction.core.ontology.base.classification.DatabaseOntologyClassification;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

/**
 * @author edwardblurock
 * 
 *         This class generates the FirestoreCatalogID as an array of
 *         CollectionDocumentIDPair The elements of the CollectionDocumentIDPair
 *         are generated as specified by the subclass of the
 *         CollectionDocumentHierarchy: rdfs:isDefinedBy: How the label is to be
 *         derived dc:type: Which element in CollectionDocumentIDPair to fill in
 * 
 *         The main routine: {@link searchForCatalogObjectInHierarchyTemplate}
 *
 */
public class CreateHierarchyElement {

	static String topOfHierarchy = "dataset:CollectionDocumentHierarchy";
	static String simpleName = "dataset:DatasetCatalogHierarchySimpleName";
	static String datacatalog = "dataset:DatasetCatalogHierarchyDataCatalog";
	static String collection = "dataset:DatasetCatalogHierarchyCollection";
	static String document = "dataset:DatasetCatalogHierarchyDocument";
	static String firestoreid = "dataset:FirestoreCatalogID";

	/**
	 * Generate the FirestoreCatalogID from the class
	 * 
	 * The classname and the catalog object is used to generate the
	 * FirestoreCatalogID. The catalog object and classname elements may be used in
	 * deteriming the document and collection names of the firestore hierarchy.
	 * 
	 * @param catalogC The classname of the catalog object
	 * @param json     The catalog object
	 * 
	 * @return FirestoreCatalogID with generated CollectionDocumentIDPair
	 */
	public static JsonObject searchForCatalogObjectInHierarchyTemplate(JsonObject json) {
		JsonObject firestoreaddress = null;
		JsonArray pairs = new JsonArray();
		JsonObject pair = initialCollectionDocumentIDPair();
		String identifier = json.get(AnnotationObjectsLabels.identifier).getAsString();
		String catalogC = GenericSimpleQueries.classFromIdentifier(identifier);
		if (catalogC == null) {
			System.err.println("System Error: Identifier as class not found: " + identifier);
		} else {
			ClassificationHierarchy hierarchy = DatabaseOntologyClassification
					.getClassificationHierarchy(topOfHierarchy);

			if (search(hierarchy, json, pairs, pair, catalogC)) {
				int basenum = pairs.size() - 1;
				firestoreaddress = CreateDocumentTemplate.createTemplate(firestoreid);
				JsonArray subpairs = new JsonArray();
				Iterator<JsonElement> iter = pairs.iterator();
				while (iter.hasNext()) {
					JsonObject p = (JsonObject) iter.next();
					if (p.get(ClassLabelConstants.DatasetIDLevel).getAsInt() == basenum) {
						try {
							firestoreaddress.addProperty(ClassLabelConstants.DataCatalog,
									p.get(ClassLabelConstants.DatasetCollectionID).getAsString());
							firestoreaddress.addProperty(ClassLabelConstants.SimpleCatalogName,
									p.get(ClassLabelConstants.DatasetDocumentID).getAsString());
						} catch (NullPointerException ex) {
							System.err.println("Null Pointer Exception: catalogC \n" + catalogC);
							System.err.println("Null Pointer Exception: p \n" + JsonObjectUtilities.toString(p));
							System.err
									.println("Null Pointer Exception: pairs \n" + JsonObjectUtilities.toString(pairs));
							System.err.println("Null Pointer Exception: json \n" + JsonObjectUtilities.toString(json));
							throw ex;
						}
					} else {
						subpairs.add(p);
					}
				}
				JsonObject pairset = firestoreaddress.get(ClassLabelConstants.CollectionDocumentIDPairAddress)
						.getAsJsonObject();
				pairset.add(ClassLabelConstants.CollectionDocumentIDPair, subpairs);
			} else {
				System.err.println("Catalog object not found in hierarchy: " + catalogC);
			}
		}
		return firestoreaddress;
	}

	/**
	 * Search down the classification hierarchy and fill in FirestoreCatalogID
	 * 
	 * @param hierarchy The classification hierarchy starting with
	 *                  dataset:CollectionDocumentHierarchy
	 * @param json      The catalog object in json form
	 * @param pairs     The current array of CollectionDocumentIDPair
	 *                  (FirestoreCatalogID)
	 * @param pair      the CollectionDocumentIDPair being built
	 * @param catalogC  The classname of the catalog object
	 * @return true if the end point of the hierarch y has been found and the
	 *         FirestoreCatalogID is being filled in
	 */
	private static boolean search(ClassificationHierarchy hierarchy, JsonObject json, JsonArray pairs, JsonObject pair,
			String catalogC) {
		boolean foundB = false;
		String member = OntologyUtilityRoutines.exactlyOnePropertySingle(hierarchy.getClassification(),
				OntologyObjectLabels.member);

		if (member != null) {
			if (member.equals(catalogC)) {
				foundB = true;
			} else if (GenericSimpleQueries.isSubClassOf(catalogC, member, true)) {
				foundB = true;
			}
		}
		if (foundB) {
			String genname = generateHierarchyName(hierarchy.getClassification(), catalogC, json);
			UpdateHierarchyList(hierarchy.getClassification(), genname, pair, pairs);
		} else if (hierarchy.getSubclassificatons() != null) {
			Iterator<ClassificationHierarchy> iter = hierarchy.getSubclassificatons().iterator();
			while (iter.hasNext() && !foundB) {
				ClassificationHierarchy hier = iter.next();
				foundB = search(hier, json, pairs, pair, catalogC);
			}
			if (foundB) {
				if (!hierarchy.getClassification().equals(topOfHierarchy)) {
					String genname = generateHierarchyName(hierarchy.getClassification(), catalogC, json);
					UpdateHierarchyList(hierarchy.getClassification(), genname, pair, pairs);
				}
			}
		}
		if (hierarchy.getClassification().equals(topOfHierarchy)) {
			addPairToArray(pair, pairs);
		}
		return foundB;
	}

	/**
	 * @param hierclass the current hierarchy class name
	 * @param genname   The generated name (as given by the hierarchy class)
	 * @param pair      The current CollectionDocumentIDPair being filled in
	 * @param pairs     The current array of CollectionDocumentIDPair
	 *                  (FirestoreCatalogID)
	 * @return The new CollectionDocumentIDPair
	 * 
	 *         From the hierarchy class, what name is to be filled in (document or
	 *         collection) is determined This determined the position in the
	 *         CollectionDocumentIDPair addInCollectionDocumentIDPair determines how
	 *         the pair is to be updated.
	 * 
	 */
	public static void UpdateHierarchyList(String hierclass, String genname, JsonObject pair, JsonArray pairs) {
		String type = DatasetOntologyParseBase.getValueFromAnnotation(hierclass, OntologyObjectLabels.dctype);
		if (type.equals(simpleName)) {
			addInCollectionDocumentIDPair(ClassLabelConstants.DatasetDocumentID, genname, pair, pairs);
		} else if (type.equals(datacatalog)) {
			addInCollectionDocumentIDPair(ClassLabelConstants.DatasetCollectionID, genname, pair, pairs);
		} else if (type.equals(collection)) {
			addInCollectionDocumentIDPair(ClassLabelConstants.DatasetCollectionID, genname, pair, pairs);
		} else if (type.equals(document)) {
			addInCollectionDocumentIDPair(ClassLabelConstants.DatasetDocumentID, genname, pair, pairs);
		}
	}

	/**
	 * Fill in the CollectionDocumentIDPair
	 * 
	 * @param genname    The generated name
	 * @param identifier The position in CollectionDocumentIDPair
	 * @param json       the current CollectionDocumentIDPair
	 * @param pairs      The current array of CollectionDocumentIDPair
	 *                   (FirestoreCatalogID)
	 * @return The 'new' current CollectionDocumentIDPair
	 * 
	 *         This fills in the CollectionDocumentIDPair If the element pointed to
	 *         by the identifier is non-null, this means that the
	 *         CollectionDocumentIDPair is full and should be added to the
	 *         FirestoreCatalogID. if this is true, then a new (empty)
	 *         CollectionDocumentIDPair is generated and filled in.
	 * 
	 */
	private static void addInCollectionDocumentIDPair(String identifier, String genname, JsonObject pair,
			JsonArray pairs) {
		if (pair.get(identifier) == null) {
			pair.addProperty(identifier, genname);
		} else {
			JsonObject newjson = initialCollectionDocumentIDPair();
			String docid = pair.get(ClassLabelConstants.DatasetDocumentID).getAsString();
			newjson.addProperty(ClassLabelConstants.DatasetDocumentID, docid);
			String colid = pair.get(ClassLabelConstants.DatasetCollectionID).getAsString();
			newjson.addProperty(ClassLabelConstants.DatasetCollectionID, colid);
			pair.remove(ClassLabelConstants.DatasetDocumentID);
			pair.remove(ClassLabelConstants.DatasetCollectionID);
			pair.addProperty(identifier, genname);
			addPairToArray(newjson, pairs);
		}
	}

	/**
	 * Add a CollectionDocumentIDPair to the FirestoreCatalogID and update the
	 * levels
	 * 
	 * @param json  The CollectionDocumentIDPair to add
	 * @param pairs The FirestoreCatalogID
	 */
	private static void addPairToArray(JsonObject json, JsonArray pairs) {
		for (JsonElement ele : pairs) {
			JsonObject obj = (JsonObject) ele;
			int level = obj.get(ClassLabelConstants.DatasetIDLevel).getAsInt();
			level++;
			obj.addProperty(ClassLabelConstants.DatasetIDLevel, level);
		}
		pairs.add(json);
	}

	/**
	 * Create an empty CollectionDocumentIDPair (level is set to zero).
	 * 
	 * @return An initial CollectionDocumentIDPair
	 */
	private static JsonObject initialCollectionDocumentIDPair() {
		JsonObject json = new JsonObject();
		json.addProperty(ClassLabelConstants.DatasetIDLevel, 0);
		return json;
	}

	/**
	 * Generate the Hierarchy name
	 * 
	 * Derive a name given the hierarchy class name
	 * 
	 * @param hierclass The hierarchy class name
	 * @param classname The class name of the object
	 * @param json      The object in JsonObject form
	 * @return The derived name
	 */
	public static String generateHierarchyName(String hierclass, String classname, JsonObject json) {
		String name = null;
		try {
			String isdefinedby = DatasetOntologyParseBase.getValueFromAnnotation(hierclass,
					OntologyObjectLabels.isDefinedBy);
			String isdefinedbyShort = isdefinedby.substring(8);
			name = GenerateStringLabel.valueOf(isdefinedbyShort).deriveName(hierclass, classname, json);

			String key = json.get(ClassLabelConstants.CatalogObjectKey).getAsString();
		} catch (Exception ex) {
			System.err.println("generateHierarchyName(" + hierclass + ", " + classname + ")");
			System.err.println(ex.toString());
		}
		return name;
	}

}
