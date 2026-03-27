package info.esblurock.background.services.set.bensonrule;

import static org.junit.Assert.*;

import java.util.HashSet;

import org.junit.Test;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.jthermodynamics.bensonrules.ComputeBensonRulesForMolecule;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.compute.utilities.StringToAtomContainer;
import thermo.data.structure.structure.MetaAtomInfo;
import thermo.exception.ThermodynamicComputeException;

public class TestComputeThermodynamicsWithBensonRules {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String nancy = "ch2//ch/ch3";
		String maintainer = "Administrator";
		String dataset = "StandardDataset";
		String infoS = "{"
				+ "\"dataset:paramspecenthalpy\": {\n"
				+ "			\"qudt:Unit\": {\n"
				+ "				\"qudt:SystemOfQuantities\": \"quantitykind:MolarEnergy\",\n"
				+ "				\"qudt:QuantityKind\": \"unit:KiloCAL-PER-MOL\"\n"
				+ "			},\n"
				+ "			\"dataset:dynamicType\": \"FixedParameter\",\n"
				+ "			\"skos:prefLabel\": \"Enthaply\",\n"
				+ "			\"dataset:uncertainty\": \"dataset:ImpliedDigitsUncertainty\"\n"
				+ "		},\n"
				+ "		\"dataset:paramspecentropy\": {\n"
				+ "			\"qudt:Unit\": {\n"
				+ "				\"qudt:SystemOfQuantities\": \"quantitykind:MolarEntropy\",\n"
				+ "				\"qudt:QuantityKind\": \"unit:J-PER-MOL-K\"\n"
				+ "			},\n"
				+ "			\"dataset:dynamicType\": \"FixedParameter\",\n"
				+ "			\"skos:prefLabel\": \"Entropy\",\n"
				+ "			\"dataset:uncertainty\": \"dataset:ImpliedDigitsUncertainty\"\n"
				+ "		},\n"
				+ "		\"dataset:paramspecheatcapacity\": {\n"
				+ "			\"qudt:Unit\": {\n"
				+ "				\"qudt:SystemOfQuantities\": \"quantitykind:MolarHeatCapacity\",\n"
				+ "				\"qudt:QuantityKind\": \"unit:J-PER-MOL-K\"\n"
				+ "			},\n"
				+ "			\"dataset:dynamicType\": \"FixedParameter\",\n"
				+ "			\"skos:prefLabel\": \"Heat Capacity\",\n"
				+ "			\"dataset:uncertainty\": \"dataset:ImpliedDigitsUncertainty\"\n"
				+ "		}\n"
				+ "}";
		
		JsonObject info = JsonObjectUtilities.jsonObjectFromString(infoS);
		
		HashSet<MetaAtomInfo> metaatoms = new HashSet<MetaAtomInfo>();
		StringToAtomContainer convert = new StringToAtomContainer(metaatoms);
		try {
			IAtomContainer molecule = convert.nancylinearToAtomContainer(nancy);
			JsonObject response = ComputeBensonRulesForMolecule.compute(maintainer, dataset, molecule, info);
			JsonObjectUtilities.printResponse(response);
		} catch (ThermodynamicComputeException e) {
			e.printStackTrace();
		}
		
	}

}
