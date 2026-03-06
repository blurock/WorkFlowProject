package info.esblurock.reaction.core;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Iterator;
import java.util.List;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Node;
import org.dom4j.io.OutputFormat;
import org.dom4j.io.XMLWriter;

public class MessageConstructor {

	public static Document startDocument(String title) {
		Document document = DocumentHelper.createDocument();
		Element html = document.addElement("html");
		Element head = html.addElement("head");
		head.addElement("title").addText(title);
		html.addElement("body");
		return document;
	}

	public static Element isolateBody(Document document) {
		Element body = null;
		Element rootElement = document.getRootElement();
	    body = rootElement.element("body");
		return body;
	}

	public static Element isolateBody(String text) {
		Element body = null;
		try {
			Document document = DocumentHelper.parseText(text);
			body = isolateBody(document);
		} catch (DocumentException e) {
			e.printStackTrace();
		}
		return body;
	}

	public static void combineBodyIntoDocument(Document first, String second) {
		try {
			Document secondD = DocumentHelper.parseText(second);
			combineBodyIntoDocument(first, secondD);
		} catch (DocumentException e) {
			e.printStackTrace();
		}
	}

	public static void combineBodyIntoDocument(Document first, Document second) {
		Element body1 = isolateBody(first);
		Element body2 = isolateBody(second);
		Iterator<Element> iter = body2.elementIterator();
		while (iter.hasNext()) {
			Element element = iter.next();
			element.detach();
			body1.add(element);
		}
	}

	public static String DocumentToString(Document document) {
		OutputFormat format = OutputFormat.createPrettyPrint();
		format.setIndent(true);
		format.setIndent("	");
		format.setNewlines(true);
		ByteArrayOutputStream stream = new ByteArrayOutputStream(10000);
		XMLWriter writer;
		String out = "";
		try {
			writer = new XMLWriter(stream, format);
			writer.write(document);
			writer.close();
			out = stream.toString();
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return out;
	}

}
