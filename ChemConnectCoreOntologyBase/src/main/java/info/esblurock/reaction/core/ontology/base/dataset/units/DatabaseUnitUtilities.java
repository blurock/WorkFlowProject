package info.esblurock.reaction.core.ontology.base.dataset.units;

import java.util.List;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.OntologyBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;

public class DatabaseUnitUtilities {
	
	/**
	 * @param value The value to convert
	 * @param valueunits The units of the value
	 * @param finalunits The units of the final (destination) value
	 * @return The original value converted to the value in final units 
	 * 
	 * If the unit is not listed or if the conversion factor is not in the ontology, 
	 * then default multiplity (1.0) and default offset (0.0) are used.
	 * 
	 * Compatible units are tested with the dimension vector of QUDT
	 */
	public static Double conversion(Double value, String valueunits, String finalunits) {
		Double finalvalue = null;
		String dimensionorig = findDimensionVector(valueunits);
		String dimensionfinal = findDimensionVector(finalunits);
		finalvalue = value;
		
		//if(dimensionorig != null && dimensionfinal != null) {
		//	if(dimensionorig.equals(dimensionfinal) ) {
	
			Double multorig = findMultiplierConversionToStandard(valueunits);
			Double offsetorig = findOfsetConversionToStandard(valueunits);
			Double multfinal = findMultiplierConversionToStandard(finalunits);
			Double offsetfinal = findOfsetConversionToStandard(finalunits);
			
			Double standard = value*multorig + offsetorig;
			finalvalue = standard/multfinal - offsetfinal;
			/*
		} else {
			System.out.println("Unmatching Dimensions:");
			System.out.println("Original: '" + dimensionorig + "'");
			System.out.println("Final:    '" + dimensionfinal + "'");
		}
		} else {
			System.out.println("Unit Dimension not found");
			System.out.println("Original: " + dimensionorig);
			System.out.println("Final:    " + dimensionfinal);
		}
		*/
		return finalvalue;
	}

	/** The multiplicative factor for the unit
	 * 
	 * @param valueunits The units to find conversion factor
	 * @return The multiplicative conversion factor
	 */
	private static Double findMultiplierConversionToStandard(String valueunits) {
		String query = "SELECT ?conversion\n"
				+ "WHERE {\n"
				+ valueunits + " qudt:conversionMultiplier ?conversion\n"
						+ "}";
		List<String> lst = OntologyBase.isolateProperty(query, "conversion");
		Double mult = 1.0;
		if(lst.size() > 0) {
			mult = Double.valueOf(lst.get(0));
		}
		return mult;
		}
	
	/** The offset factor for the unit
	 * 
	 * @param valueunits The units to find conversion factor
	 * @return The offset conversion factor
	 */
	private static Double findOfsetConversionToStandard(String valueunits) {
		String query = "SELECT ?conversion\n"
				+ "WHERE {\n"
				+ valueunits + " qudt:conversionOffset ?conversion\n"
						+ "}";
		List<String> lst = OntologyBase.isolateProperty(query, "conversion");
		Double offset = 0.0;
		if(lst.size() > 0) {
			offset = Double.valueOf(lst.get(0));
		}
		return offset;
		}

		/** Find dimension of unit (null if not found)
		 * 
		 * @param valueunits The units to find dimension
		 * @return dimension of unit (null if not found)
		 * 
		 * This routine can be used to determine whether the specified unit exists.
		 * 
		 */
		public static String findDimensionVector(String valueunits) {
		String query = "SELECT ?dimension\n"
				+ "WHERE {\n"
				+ valueunits + " qudt:hasDimensionVector ?dimension\n"
						+ "}";
		List<String> lst = OntologyBase.isolateProperty(query, "dimension");
		String dimension = null;
		if(lst.size() > 0) {
			dimension = lst.get(0);
		}
		return dimension;
		}
		
		/** Find the list of valid units for the quantitykind object
		 * 
		 * @param quantitykind The quantitykind object
		 * @return The list of valid units
		 * 
		 */
		public static List<String> unitsOfQuantityKind(String quantitykind) {
			String query = "SELECT ?units\n"
					+ "WHERE {\n"
					+ quantitykind + " qudt:applicableUnit ?units\n"
							+ "}";
			List<String> lst = OntologyBase.isolateProperty(query, "units");
			return lst;
		}
		
		/** Are units in the quantitykind object
		 * 
		 * @param units The units to query
		 * @param quantitykind T
		 * @return true if the units belong to the quantitykind
		 * 
		 */
		public static boolean areUnitsInQuantityKind(String units, String quantitykind) {
			String query = "ASK \n"
					+ "{\n"
					+ quantitykind + " qudt:applicableUnit " + units + "\n"
							+ "}";
			boolean ans = OntologyBase.datasetASK(query);
			return ans;
		}
		
		public static JsonObject createEmptyParameter(String parametertype, String units, String uncertainty) {
			JsonObject parameter = CreateDocumentTemplate.createTemplate(parametertype);
			String query = "SELECT ?units\n"
					+ "WHERE {\n"
					+ "?quantitykind qudt:applicableUnit " +  units + "\n"
							+ "}";
			List<String> lst = OntologyBase.isolateProperty(query, "quantitykind");
			String quantitykind= null;
			if(lst.size() > 0) {
				quantitykind = lst.get(0);
			}
			
			JsonObject spec = CreateDocumentTemplate.createTemplate("dataset:ParameterSpecification");
			parameter.add(ClassLabelConstants.ParameterSpecification,spec);
			JsonObject valueunits = CreateDocumentTemplate.createTemplate("dataset:ValueUnits");
			spec.add(ClassLabelConstants.ValueUnits,valueunits);
			valueunits.addProperty(ClassLabelConstants.UnitsOfValue, units);
			valueunits.addProperty(ClassLabelConstants.UnitClass, quantitykind);
			spec.addProperty(ClassLabelConstants.ParameterLabel, parametertype.substring(8));
			spec.addProperty(ClassLabelConstants.ParameterTypeSpecification, "dataset:FixedParameter");
			spec.addProperty(ClassLabelConstants.DataPointUncertainty, uncertainty);
			
			return parameter;
		}

}
