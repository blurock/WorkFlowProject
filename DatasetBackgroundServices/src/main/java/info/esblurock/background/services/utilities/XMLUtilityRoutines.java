package info.esblurock.background.services.utilities;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


import java.io.StringReader;

//import javax.xml.parsers.DocumentBuilder;
//import javax.xml.parsers.DocumentBuilderFactory;

import org.json.JSONObject;
import org.json.XML;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class XMLUtilityRoutines {
	public static Document convertStringToXMLDocument(String xmlString) {
		Document doc = null;
		try {
		    doc = DocumentHelper.parseText("<?xml version=\"1.0\"  encoding=\"UTF-8\"?>\n" + xmlString);
		} catch (Exception e) {
			System.out.println("XMLUtilityRoutines:\n" + xmlString);
			e.printStackTrace();
		}
		return doc;
	}

	public static JsonObject convertXMLToJsonObject(Node node) {
		JsonObject json = null;
	       if (node.getNodeType() == Node.ELEMENT_NODE) {
	    	   Element element = (Element) node;
	    	   json = convertXMLToJsonObject(element);
	       } else {
	    	   System.out.println("Node not element: " + node.getNodeType());
	       }
	       return json;
	}

	public static JsonObject convertXMLToJsonObject(Element element) {
		JsonObject jsonobject = null;
		//try {
			/*
			TransformerFactory transformerFactory = TransformerFactory.newInstance();
			Transformer transformer = transformerFactory.newTransformer();
			DOMSource source = new DOMSource(element);
			StreamResult result = new StreamResult(new StringWriter());
			transformer.transform(source, result);
			String strObject = result.getWriter().toString();
*/ 
		
			String strObject = element.asXML();
			JSONObject json = XML.toJSONObject(strObject);
			jsonobject = JsonObjectUtilities.jsonObjectFromString(json.toString());
			/*
		} catch (TransformerException ex) {
			System.out.println("Transformer error");
			System.out.println(ex);
		}
		*/
		return jsonobject;
	}

	public static String convertXMLToString(Node node) {
		String str = null;
		if (node.getNodeType() == Node.ELEMENT_NODE) {
			Element element = (Element) node;
			str = convertXMLToString(element);
		}
		return str;
	}

	public static String convertXMLToString(Element element) {
		/*
		String strObject = null;
		try {
			TransformerFactory transformerFactory = TransformerFactory.newInstance();
			Transformer transformer = transformerFactory.newTransformer();
			DOMSource source = new DOMSource(element);
			StreamResult result = new StreamResult(new StringWriter());
			transformer.transform(source, result);
			strObject = result.getWriter().toString();
		} catch (TransformerException ex) {
			System.out.println(ex);
		}
		return strObject;
		*/
		return element.asXML();
	}
	
	public static JsonObject getJsonObjectFromDocument(Document doc, String identifier) {
		Element root = doc.getRootElement();
		return getJsonObjectFromDocument(root,identifier);

	}
	public static JsonObject getJsonObjectFromDocument(Element root, String identifier) {
		System.out.println("getJsonObjectFromDocument: root =\n" + root.asXML());
		List<Element> sym = root.elements();
		System.out.println("size = " + sym.size());
		System.out.println("getJsonObjectFromDocument: dataset:JThermodynamicsSymmetryDefinitionFormat 0 =\n" + sym.get(0).getQName());
		System.out.println("getJsonObjectFromDocument: dataset:JThermodynamicsSymmetryDefinitionFormat 1 =\n" + sym.get(1).getQName());
		System.out.println("getJsonObjectFromDocument: dataset:JThermodynamicsSymmetryDefinitionFormat symmetrydefinition =\n" + root.element("symmetrydefinition").asXML());
		Element node = root.element(identifier);
		/*
		NodeList list = doc.getElementsByTagName(identifier);
		Node node = list.item(0);
		JsonObject result = XMLUtilityRoutines.convertXMLToJsonObject(node);
		*/
		
		System.out.println("convertXMLToJsonObject:\n" + node);
		System.out.println("convertXMLToJsonObject:\n" + identifier);
		JsonObject result = XMLUtilityRoutines.convertXMLToJsonObject(root);
		System.out.println("getJsonObjectFromDocument: Json=\n" + JsonObjectUtilities.toString(result));
		
		JsonObject top = result.get(identifier).getAsJsonObject();
		return top;
	}
	
	public static String retrieveAsStringFromDocument(Document doc, String identifier) {
		Element node = doc.getRootElement().element(identifier);
		return retrieveAsStringFromDocument(node,identifier);
	}
	
	public static String retrieveAsStringFromDocument(Element node, String identifier) {
		//NodeList list = doc.getElementsByTagName(identifier);
		//Node node = list.item(0);
		String strObject = XMLUtilityRoutines.convertXMLToString(node);
		return strObject;
	}
	
	public static String[] parseObjectsFromXMLString(String documentS, String identifier) {
		Document document = convertStringToXMLDocument(documentS);
		System.out.println(document.getRootElement());
		Element node = document.getRootElement();
		List<Element> childNodes = node.elements();
		String[] lst = new String[childNodes.size()];
		String[] parts = identifier.split(":");
		String id = parts[1];
		int i=0;
		for (Element child : childNodes) {
			String content = convertXMLToString(child);
			lst[i++] = content;
            
        }
		/*
		//NodeList nlst = document.getElementsByTagName(identifier);
        //System.out.println("parseObjectsFromXMLString: " + nlst.getLength());
		String[] lst = new String[nlst.getLength()];
		for(int i=0; i < nlst.getLength();i++) {
			Node node = nlst.item(i);
			String content = convertXMLToString(node);
			lst[i] = content;
		}
		
		*/
		return lst;
	}
}
