package info.esblurock.reaction.core.ontology.base.units;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.units.DatabaseUnitUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateEmptyUnit {

	@Test
	public void test() {
		JsonObject parameter = DatabaseUnitUtilities.createEmptyParameter("dataset:ThermodynamicStandardEntropy", 
				"unit:J-PER-MOL-K", "dataset:ImpliedDigitsUncertainty");
		System.out.println(JsonObjectUtilities.toString(parameter));
	}

}
