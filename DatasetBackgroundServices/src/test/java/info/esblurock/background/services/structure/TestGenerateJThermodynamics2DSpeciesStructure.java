package info.esblurock.background.services.structure;

import java.sql.SQLException;
import java.util.HashSet;

import org.junit.Test;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.structure.GenerateJThermodynamics2DSpeciesStructure;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.linearform.NancyLinearFormToMolecule;
import thermo.data.structure.structure.MetaAtomInfo;

public class TestGenerateJThermodynamics2DSpeciesStructure {

	@Test
	public void test() {

		NancyLinearFormToMolecule convert = new NancyLinearFormToMolecule(new HashSet<MetaAtomInfo>());
		try {
			String nancy1 = "ch2//ch/ch3";
			IAtomContainer molecule = convert.convert(nancy1);
			JsonObject json2dmolecule1 = GenerateJThermodynamics2DSpeciesStructure.generate(molecule);
			System.out.println(JsonObjectUtilities.toString(json2dmolecule1));
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

}
