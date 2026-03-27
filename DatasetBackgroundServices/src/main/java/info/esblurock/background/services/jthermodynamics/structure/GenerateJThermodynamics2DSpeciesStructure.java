package info.esblurock.background.services.jthermodynamics.structure;

import java.util.HashSet;
import java.util.Iterator;

import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import thermo.data.structure.structure.AtomCounts;
import thermo.data.structure.structure.StructureAsCML;

public class GenerateJThermodynamics2DSpeciesStructure {

	public static JsonObject generate(IAtomContainer molecule) {
		String classname = "dataset:JThermodynamics2DSpeciesStructure";
		JsonObject catalog = CreateDocumentTemplate.createTemplate(classname);
		JsonObject atomcounts = CreateDocumentTemplate.createTemplate("dataset:JThermodynamicsAtomCountSet");
		catalog.add(ClassLabelConstants.JThermodynamicsAtomCountSet, atomcounts);
		AtomCounts counts = new AtomCounts(molecule);
		try {
			StructureAsCML structure = new StructureAsCML(molecule);
			String oxygenCountS = "0";
			if (counts.get("O") != null) {
				oxygenCountS = Integer.toString(counts.get("O"));
			}
			String hydrogenCountS = "0";
			if (counts.get("H") != null) {
				hydrogenCountS = Integer.toString(counts.get("H"));
			}
			String carbonCountS = "0";
			if (counts.get("C") != null) {
				carbonCountS = Integer.toString(counts.get("C"));
			}
			String molname = molecule.getID();
			String isomername = counts.isomerName();
			if (molname.length() == 0) {
				molname = isomername;
			}
			catalog.addProperty(ClassLabelConstants.JThermodynamicsStructureName, molname);
			catalog.addProperty(ClassLabelConstants.JThermodynamicsStructureAsCMLString,
					structure.getCmlStructureString());
			catalog.addProperty(ClassLabelConstants.JThermodynamicsStructureIsomerName, isomername);
			atomcounts.addProperty(ClassLabelConstants.CarbonAtomCount, carbonCountS);
			atomcounts.addProperty(ClassLabelConstants.HydrogenAtomCount, hydrogenCountS);
			atomcounts.addProperty(ClassLabelConstants.OxygenAtomCount, oxygenCountS);
			JsonArray countarray = atomcounts.get(ClassLabelConstants.JThermodynamicsAtomCount).getAsJsonArray();
			HashSet<String> nameset = counts.getAtomNames();
			Iterator<String> iter = nameset.iterator();
			while (iter.hasNext()) {
				String atomname = iter.next();
				Integer atomcnt = counts.get(atomname);
				JsonObject atomcount = CreateDocumentTemplate.createTemplate("dataset:JThermodynamicsAtomCount");
				atomcount.addProperty(ClassLabelConstants.AtomTypeCount, atomcnt.toString());
				atomcount.addProperty(ClassLabelConstants.JThermodynamics2DSpeciesLabel, atomname);
				countarray.add(atomcount);
			}
		} catch (CDKException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		return catalog;
	}
}
