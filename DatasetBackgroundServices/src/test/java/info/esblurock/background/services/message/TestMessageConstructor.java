package info.esblurock.background.services.message;

import static org.junit.Assert.*;

import java.util.Iterator;
import java.util.List;

import org.dom4j.Document;
import org.dom4j.Element;
import org.dom4j.Node;
import org.junit.Test;

import info.esblurock.reaction.core.MessageConstructor;

public class TestMessageConstructor {

	@Test
	public void test() {
		Document document = MessageConstructor.startDocument("Title");
		String documentS = document.asXML().toString();
		System.out.println(documentS);

		System.out.println("---------------");
		List<Node> nodes = document.content();
		Iterator<Node> iter = nodes.iterator();
		while (iter.hasNext()) {
			Element element = (Element) iter.next();
			System.out.println(element.asXML().toString());
		}
		System.out.println("---------------");

		Element body = MessageConstructor.isolateBody(document);
		body.addElement("div", "Some Text");
		body.addElement("div", "Some more Text");
		documentS = document.asXML().toString();
		nodes = body.content();

		System.out.println("---------------");
		System.out.println(MessageConstructor.DocumentToString(document));
		System.out.println("---------------");
		iter = nodes.iterator();
		while (iter.hasNext()) {
			Element element = (Element) iter.next();
			System.out.println(element.asXML().toString());
		}
		System.out.println("---------------");

	}

}
