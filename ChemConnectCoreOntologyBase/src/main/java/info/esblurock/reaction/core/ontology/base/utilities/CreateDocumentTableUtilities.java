package info.esblurock.reaction.core.ontology.base.utilities;

import java.util.List;

import org.dom4j.Element;

public class CreateDocumentTableUtilities {
	
	public static Element createTableWithHeader(Element body, List<String> headerList) {
		Element tableElement = body.addElement("table");
		Element theadElement = tableElement.addElement("thead");
		Element thrElement = theadElement.addElement("tr");
		
		for (String header : headerList) {
			Element thElement = thrElement.addElement("th");
			thElement.addText(header);
			thElement.addAttribute("style", "border: 1px solid black;");
		}
		
		tableElement.addAttribute("style", "border: 1px solid black;");
		Element tbody = tableElement.addElement("tbody");
		return tbody;
	}
	
	public static Element createTableRow(Element tbodyElement, List<String> rowData) {
		Element trElement = tbodyElement.addElement("tr");

		for (String data : rowData) {
			Element tdElement = trElement.addElement("td");
			tdElement.addText(data);
			tdElement.addAttribute("style", "border: 1px solid black;");
		}

		return trElement;
	}

}
