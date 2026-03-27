package info.esblurock.background.services.set.bensonrule;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.Collections;

import org.junit.Test;

import jThergas.data.group.JThergasGroupElement;

public class TestJThergasGroupElement {

	@Test
	public void test() {
		JThergasGroupElement groupelement1 = new JThergasGroupElement("f", 2);
		JThergasGroupElement groupelement2 = new JThergasGroupElement("ar", 2);
		JThergasGroupElement groupelement3 = new JThergasGroupElement("h", 2);
		JThergasGroupElement groupelement4 = new JThergasGroupElement("c", 2);
		JThergasGroupElement groupelement5 = new JThergasGroupElement("c/t", 2);
		JThergasGroupElement groupelement6 = new JThergasGroupElement("c/d", 2);
		ArrayList<JThergasGroupElement> lst = new ArrayList<JThergasGroupElement>();
		lst.add(groupelement5);
		lst.add(groupelement6);
		lst.add(groupelement1);
		lst.add(groupelement2);
		lst.add(groupelement3);
		lst.add(groupelement4);

		Collections.sort(lst);

		for (JThergasGroupElement element : lst) {
			System.out.println(element.getGroupElementName());
		}

	}

}
