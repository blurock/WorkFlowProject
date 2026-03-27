package info.esblurock.background.services.set.metaatoms;

import java.util.ArrayList;
import java.util.Iterator;

import org.junit.Test;

import info.esblurock.background.services.service.rdfs.FindMetaAtomsInFromRDFs;
import thermo.data.structure.structure.MetaAtomDefinition;

public class TestFindMetaAtomInfo {
	@Test
	public void test() {

		String obj = "BensonAtom";
		ArrayList<MetaAtomDefinition> defs = FindMetaAtomsInFromRDFs.getMetaAtomDefinitionsByType(obj);
		Iterator<MetaAtomDefinition> iter = defs.iterator();
		while (iter.hasNext()) {
			MetaAtomDefinition definition = iter.next();
			System.out.println("---------------------------------------------------------------------");
			System.out.println(definition.toString());
			System.out.println("---------------------------------------------------------------------");

		}

	}
}
