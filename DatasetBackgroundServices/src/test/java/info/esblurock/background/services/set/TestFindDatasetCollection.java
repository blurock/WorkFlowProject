package info.esblurock.background.services.set;

import java.util.ArrayList;
import java.util.Iterator;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.dataset.FindMetaAtomDefinitionsInDatasetCollection;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import thermo.data.structure.structure.MetaAtomDefinition;

public class TestFindDatasetCollection {

	@Test
	public void test() {
		String maintainer = "Administrator";
		String dataset = "StandardData";
		JsonObject setofprops = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		JsonArray arr = new JsonArray();
		setofprops.add(ClassLabelConstants.PropertyValueQueryPair,arr);
		JsonObject prop = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		prop.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:jthermometaatominfo.dataset:metaatomlabel");
		prop.addProperty(ClassLabelConstants.ShortStringKey, "BensonAtom");
		arr.add(prop);

		
		JsonArray metaarr = FindMetaAtomDefinitionsInDatasetCollection.findMetaAtomDefinitions(maintainer, dataset,"BensonAtom");
		ArrayList<MetaAtomDefinition> defs = FindMetaAtomDefinitionsInDatasetCollection.findMetaAtomDefinitions(metaarr);
		if (defs != null) {
			Iterator<MetaAtomDefinition> iter = defs.iterator();
			System.out.println("---------------------------------------------");
			System.out.println("Number of definitions: " + defs.size());
			while (iter.hasNext()) {
				MetaAtomDefinition def = iter.next();
				System.out.println("---------------------------------------------");
				System.out.println(def.toString());
			}
			System.out.println("---------------------------------------------");
		} else {
			System.out.println("******** Error in reading MetaAtomDefinitions");
		}
	}

}
