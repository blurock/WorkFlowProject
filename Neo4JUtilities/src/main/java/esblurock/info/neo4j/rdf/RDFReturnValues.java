package esblurock.info.neo4j.rdf;
import java.awt.Label;
import java.util.Map;
import java.util.prefs.NodeChangeEvent;

import org.dom4j.Element;
import org.neo4j.driver.Record;
import org.neo4j.driver.Value;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public enum RDFReturnValues {
	
	object {
        @Override
        JsonObject returnObject(Value value, Element bodyElement) {
        	Node node = value.asNode();
            return extractNode(node.asMap(), "object", bodyElement);
        }
    },
	subject {
		@Override
		JsonObject returnObject(Value value, Element bodyElement) {
			Node node = value.asNode();
			return extractNode(node.asMap(), "subject", bodyElement);
		}
	},
	relation {
		@Override
		JsonObject returnObject(Value value, Element bodyElement) {
			Relationship relation = value.asRelationship();
			String relationname = relation.type();
			Map<String,Object> map = relation.asMap();
			JsonObject resultJsonObject = extractNode(map, "relation", bodyElement);
			resultJsonObject.addProperty(ClassLabelConstants.RDFPredicate, relationname);
			return resultJsonObject;
		}
	},
	label {
		@Override
		JsonObject returnObject(Value value, Element bodyElement) {
		String node = value.asString();
		return extractString(node, "label", bodyElement);
	}
	};
	

	abstract JsonObject returnObject(Value value, Element bodyElement); 
	
	JsonObject extractString(String name, String recordkey, Element bodyElement) {
		JsonObject resultJsonObject = new JsonObject();
		resultJsonObject.addProperty(recordkey, name);
		Element rowElement = bodyElement.addElement("tr").addAttribute("style", "border: 1px solid black;");;
		rowElement.addElement("td").addText(recordkey).addAttribute("style", "border: 1px solid black;");;
		rowElement.addElement("td").addText("String").addAttribute("style", "border: 1px solid black;");;
		rowElement.addElement("td").addText(name).addAttribute("style", "border: 1px solid black;");;
		return resultJsonObject;
	}
	
	JsonObject extractNode(Map<String, Object> map, String recordkey, Element bodyElement) {
		JsonObject resultJsonObject = new JsonObject();
		for (String key : map.keySet()) {
			Element rowElement = bodyElement.addElement("tr").addAttribute("style", "border: 1px solid black;");;
			String object = (String) map.get(key);
			String identifier = GenericSimpleQueries.identifierFromAltLabel(key);
			rowElement.addElement("td").addText(recordkey).addAttribute("style", "border: 1px solid black;");;
			rowElement.addElement("td").addText(key).addAttribute("style", "border: 1px solid black;");;
			rowElement.addElement("td").addText(object).addAttribute("style", "border: 1px solid black;");;
			if (object.startsWith("{")) {
				JsonObject jsonObject = JsonObjectUtilities.jsonObjectFromString(object);
				resultJsonObject.add(identifier, jsonObject);
			} else {
				resultJsonObject.addProperty(identifier, object);
			}
		}
		return resultJsonObject;
    }
}
