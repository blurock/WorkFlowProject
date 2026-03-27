package info.esblurock.background.services.set.moltherm;

import static org.junit.Assert.*;

import java.util.HashSet;

import org.junit.Test;
import org.openscience.cdk.AtomContainer;
import org.openscience.cdk.exception.CDKException;

import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.structure.GenerateJThermodynamics2DSpeciesStructure;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import jThergas.data.structure.JThergasStructureData;
import jThergas.exceptions.JThergasReadException;
import thermo.compute.utilities.StringToAtomContainer;
import thermo.data.structure.structure.AtomCounts;
import thermo.data.structure.structure.MetaAtomInfo;
import thermo.data.structure.structure.StructureAsCML;
import thermo.exception.ThermodynamicComputeException;

public class TestConvertMolecule {

	@Test
	public void test() {
		// String structure = "c(ch3)3/oh";
		HashSet<MetaAtomInfo> metaatoms = new HashSet<MetaAtomInfo>();
		StringToAtomContainer convert = new StringToAtomContainer(metaatoms);
		String form = "NANCY";
		AtomContainer molecule;
		JsonObject species2dstructure = null;
		try {
			System.out.println("1 ----------------------------------------------");
			JThergasStructureData str = new JThergasStructureData();
			String line1 = " 11  66 1 'sn''cl'4         tin tetrachloride             0 1.0 1.0     212.0j73";
			String line1a = "";
			str.parse(line1, line1a, false);

			molecule = convert.stringToAtomContainer(form, str.getNancyLinearForm());
			AtomCounts counts = new AtomCounts(molecule);
			System.out.println(counts.isomerName());
			molecule.setID(str.getNameOfStructure());
			System.out.println("2 ----------------------------------------------");
			StructureAsCML cml = new StructureAsCML(molecule);
			System.out.println("3 ----------------------------------------------");
			System.out.println(cml.toString());
			System.out.println("4 ----------------------------------------------");
			species2dstructure = GenerateJThermodynamics2DSpeciesStructure.generate(molecule);
			System.out.println("5 ----------------------------------------------");
			System.out.println(JsonObjectUtilities.toString(species2dstructure));
			System.out.println("6 ----------------------------------------------");
		} catch (ThermodynamicComputeException e) {
			e.printStackTrace();
		} catch (CDKException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (JThergasReadException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

}
