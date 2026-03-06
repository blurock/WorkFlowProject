package info.esblurock.reaction.core.ontology.base.units;

import static org.junit.Assert.*;

import java.util.List;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.dataset.units.DatabaseUnitUtilities;

public class TestConversionFactor {

	@Test
	public void test() {
		
		System.out.println("unit:K    : " + DatabaseUnitUtilities.findDimensionVector("unit:K"));
		System.out.println("unit:DEG_C: " + DatabaseUnitUtilities.findDimensionVector("unit:DEG_C"));
		
		System.out.println(DatabaseUnitUtilities.areUnitsInQuantityKind("unit:KiloCAL-PER-MOL", "quantitykind:MolarEnergy"));
		
		List<String> lst = DatabaseUnitUtilities.unitsOfQuantityKind("quantitykind:MolarEnergy");
		System.out.println("Units of MolarEnergy:\n" + lst);
		
		Double ans1 = DatabaseUnitUtilities.conversion(25.0, "unit:DEG_C", "unit:K");
		System.out.println("25.0 C = " + ans1 + " K");
		
		Double ans2 = DatabaseUnitUtilities.conversion(10.0, "unit:KiloCAL-PER-MOL", "unit:J-PER-MOL");
		System.out.println("10.0 Kilocalories per mole = " + ans2 + "Joules per mole");

		Double ans3 = DatabaseUnitUtilities.conversion(4.184, "unit:J-PER-MOL", "unit:KiloCAL-PER-MOL");
		System.out.println("4.184 Joules per mole = " + ans3 + " Kilocalories per mole");
	}

}
