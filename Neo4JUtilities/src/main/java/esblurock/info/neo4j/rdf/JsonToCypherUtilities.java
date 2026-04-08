package esblurock.info.neo4j.rdf;

import static org.hamcrest.CoreMatchers.containsString;

import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.rdfs.FindRDFInClass;
import info.esblurock.reaction.core.ontology.base.rdfs.ListOfRDFInformation;
import info.esblurock.reaction.core.ontology.base.rdfs.RDFInformation;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;

public class JsonToCypherUtilities {

	private static String transactionaltlabel = DatasetOntologyParseBase
			.getAltLabelFromAnnotation("dataset:TransactionIDinRDF");
	private static String owneraltlabel = DatasetOntologyParseBase
			.getAltLabelFromAnnotation("dataset:CatalogObjectOwner");
	private static String catalogidabel = DatasetOntologyParseBase
			.getAltLabelFromAnnotation("dataset:CatalogObjectID");

	public static MapOfQueryAndProperties createSimpleRelation(JsonObject obj) {
		String transactionID = obj.get(ClassLabelConstants.TransactionID).getAsString();
		String owner = obj.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String catalogid = obj.get(ClassLabelConstants.CatalogObjectID).getAsString();

		ListOfRDFInformation rdfs = FindRDFInClass.createFullRDFForObject(obj);
		MapOfQueryAndProperties queryandproperties = new MapOfQueryAndProperties();
		for (RDFInformation rdf : rdfs.getList()) {
			Map<String, Object> proplst = new HashMap<String, Object>();
			String transid = transactionID;
			if (obj.has(ClassLabelConstants.TransactionIDinRDF)) {
				transid = obj.get(ClassLabelConstants.TransactionIDinRDF).getAsString();
			}
			proplst.put(transactionaltlabel, transid);
			String predicate = rdf.getPredicateClass();
			QueryAndProperties queryprops = null;

			String subjectnodeString = nodeCreate("subject", rdf.getSubjectNodeNameString(), rdf.getSubjectClass(),
					owner,
					true, proplst, true);
			String objectnodeString = nodeCreate("object", rdf.getObjectNodeNameString(), rdf.getObjectClass(), owner,
					false, proplst, true);
			String relationString = createRelation(predicate, null, null, owner, proplst);

			if (!queryandproperties.containsQuery(predicate)) {
				StringBuffer buffer = new StringBuffer();

				buffer.append(subjectnodeString);
				buffer.append(" ");
				buffer.append(objectnodeString);
				buffer.append(" MERGE ");
				buffer.append(relationString);
				buffer.append(" RETURN noderelation, subject, object ");
				queryprops = queryandproperties.initialQuery(predicate, buffer.toString());

			} else {
				queryprops = queryandproperties.getQuery(predicate);
			}
			queryprops.addProperties(proplst);
		}
		return queryandproperties;
	}

	public static String nodeCreate(String nodenameString, String classname, Map<String, Object> values, String owner,
			boolean subject, Map<String, Object> proplst, boolean create) {

		StringBuffer createString = new StringBuffer();
		String nodeString = createNodeWithProperties(classname, values, owner, subject, proplst, true);
		createString.append("MERGE ");
		createString.append(nodeString);
		createString.append(" ON CREATE SET " + nodenameString + ".createdAt = datetime()");
		createString.append(" MERGE (transx_" + nodenameString + ":Transaction {id: $" + transactionaltlabel + "}) ");
		createString.append(" MERGE (" + nodenameString + ")<-[:SUPPORTS]-(support_" + nodenameString
				+ ":Support)-[:FROM_TX]->(transx_" + nodenameString + ") ");

		return createString.toString();
	}

	public static String createRelation(String predicateClass, Map<String, Object> values, String transactionID,
			String owner, Map<String, Object> proplst) {
		StringBuffer buffer = new StringBuffer();
		String properties = generatePropertiesForNode(values, owner, proplst);

		buffer.append("(subject)-[");
		buffer.append("noderelation");
		if (predicateClass != null) {
			buffer.append(":");
			String predicatename = predicateClass.substring(8);
			buffer.append(predicatename);
		}
		buffer.append(" ");
		buffer.append(properties);
		buffer.append("]->(object)");

		return buffer.toString();
	}

	public static String createNodeWithProperties(String classname, Map<String, Object> values,
			String owner, boolean subject, Map<String, Object> proplst, boolean create) {

		String subjectproperties = generatePropertiesForNode(values, owner, proplst);
		StringBuffer buffer = new StringBuffer();
		buffer.append("(");

		if (subject) {
			buffer.append("subject");
		} else {
			buffer.append("object");
		}
		if (classname != null) {
			buffer.append(":");
			String nodename = classname.substring(8);
			buffer.append(nodename);
		}
		buffer.append(" ");
		buffer.append(subjectproperties);
		buffer.append(")");
		return buffer.toString();
	}

	public static String generatePropertiesForNode(Map<String, Object> values, String owner,
			Map<String, Object> propertymap) {
		StringBuffer properties = new StringBuffer();
		properties.append("{");
		if (values == null) {
			values = new HashMap<String, Object>();
		}
		boolean first = true;
		for (String id : values.keySet()) {
			if (first) {
				first = false;
			} else {
				properties.append(", ");
			}
			String classname = GenericSimpleQueries.classFromIdentifier(id);
			String altlabel = DatasetOntologyParseBase.getAltLabelFromAnnotation(classname);
			addProperty(altlabel, properties);
			propertymap.put(altlabel, values.get(id));
		}
		if (values.keySet().size() > 0) {
			properties.append(", ");
		}
		addProperty(owneraltlabel, properties);
		propertymap.put(owneraltlabel, owner);
		properties.append("}");
		return properties.toString();
	}

	private static void addProperty(String id, StringBuffer buf) {
		buf.append(id);
		buf.append(": $");
		buf.append(id);
		buf.append(" ");
	}
}
