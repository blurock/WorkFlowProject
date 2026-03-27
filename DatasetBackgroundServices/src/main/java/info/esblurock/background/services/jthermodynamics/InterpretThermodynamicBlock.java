package info.esblurock.background.services.jthermodynamics;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;

import org.dom4j.Element;
import org.openscience.cdk.AtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.structure.GenerateJThermodynamics2DSpeciesStructure;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import jThergas.data.JThermgasThermoStructureDataPoint;
import jThergas.data.group.JThergasGroupElement;
import jThergas.data.group.JThergasThermoStructureGroupPoint;
import jThergas.data.thermo.JThergasThermoData;
import jThergas.exceptions.JThergasNotAGroupElement;
import jThergas.exceptions.JThergasReadException;
import thermo.compute.utilities.StringToAtomContainer;
import thermo.data.structure.structure.MetaAtomInfo;
import thermo.exception.ThermodynamicComputeException;

public class InterpretThermodynamicBlock {
	/**
	 * @param parsed The thermodynamic block of molecule structure to be parsed
	 * @param table  The table in the document to fill
	 * @param info   The supplementary information
	 * 
	 * @return The JThermodynamics2DMoleculeThermodynamics (null if error in
	 *         parsing)
	 */
	public static JsonObject interpretMolecularThermodynamics(JsonObject parsed, Element table, JsonObject info) {
		JsonObject molthermo = CreateDocumentTemplate.createTemplate("dataset:JThermodynamics2DMoleculeThermodynamics");
		if (!interpretSpeciesStandardThermodynamics(molthermo, parsed, table, info)) {
			molthermo = null;
		}
		return molthermo;
	}

	/**
	 * @param parsed The thermodynamic block of substructures (defined by
	 *               JThermodynamicsSubstructureType) structure to be parsed
	 * @param table  The table in the document to fill
	 * @param info   The supplementary information (source of
	 *               JThermodynamicsSubstructureType)
	 * 
	 * @return The JThermodynamics2DSubstructureThermodynamics (null if error in
	 *         parsing)
	 */
	public static JsonObject interpretSubstructureThermodynamics(JsonObject parsed, Element table, JsonObject info) {
		JsonObject molthermo = CreateDocumentTemplate
				.createTemplate("dataset:JThermodynamics2DSubstructureThermodynamicsDataSet");
		if (!interpretSpeciesStandardThermodynamics(molthermo, parsed, table, info)) {
			molthermo = null;
		} else {
			String type = info.get(ClassLabelConstants.JThermodynamicsSubstructureType).getAsString();
			molthermo.addProperty(ClassLabelConstants.JThermodynamicsSubstructureType, type);
		}
		return molthermo;
	}

	/**
	 * @param molthermo The subclass of JThermodynamics2DTempDependentThermo
	 * @param parsed    The thermodynamic block of substructures
	 * @param table     The table in the document to fill
	 * @param info      The supplementary information
	 * @return The JThermodynamics2DSubstructureThermodynamics (null if error in
	 *         parsing)
	 */
	public static boolean interpretSpeciesStandardThermodynamics(JsonObject molthermo, JsonObject parsed, Element table,
			JsonObject info) {
		boolean noerror = true;
		JsonObject lines = parsed.get(ClassLabelConstants.RepositoryThermoPartitionBlock).getAsJsonObject();
		String line1 = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine1).getAsString();
		String line1a = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine1a).getAsString();
		boolean line1aB = false;
		if (line1a.length() > 0) {
			line1aB = true;
		}
		String line2 = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine2).getAsString();
		String line3 = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine3).getAsString();
		String positionS = lines.get(ClassLabelConstants.Position).getAsString();
		double positionD = lines.get(ClassLabelConstants.Position).getAsDouble();
		int group = (int) positionD;
		JThermgasThermoStructureDataPoint point = new JThermgasThermoStructureDataPoint();
		Element row = table.addElement("tr");
		String phase = "Parse";
		try {
			point.parse(line1, line1a, line2, line3, line1aB, group, group);
			phase = "Interpret Molecule";
			JsonObject molstructure = interpretMoleculeStructure(point, row, info);
			String molnameString = molstructure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
			molthermo.add(ClassLabelConstants.JThermodynamics2DSpeciesStructure, molstructure);
			phase = "Get";
			JsonObject molthermodynamics = molthermo.get(ClassLabelConstants.JThermodynamicStandardThermodynamics)
					.getAsJsonObject();
			phase = "Interpret Thermodynamics";
			interpretStandardThermodynamics(point, molthermodynamics, info, row);
			JsonObject enthalpyObject = molthermodynamics.get(ClassLabelConstants.ThermodynamicStandardEnthalpy).getAsJsonObject();
			String enthalpyValue = enthalpyObject.get(ClassLabelConstants.ValueAsString).getAsString();
			JsonObject entropyObject = molthermodynamics.get(ClassLabelConstants.ThermodynamicStandardEntropy).getAsJsonObject();
			String entropyValue = entropyObject.get(ClassLabelConstants.ValueAsString).getAsString();
			String descriptionString = molnameString + ":\tEnthalpy=" + enthalpyValue + "\tEntropy=" + entropyValue;
			molthermo.addProperty(ClassLabelConstants.ShortDescription, descriptionString);
			phase = "complete";
		} catch (JThergasReadException e) {
			noerror = false;
			row.addElement("td").addText("'" + line1 + "' Error in " + phase + ": " + e.getMessage());
		} catch (Exception e) {
			noerror = false;
			row.addElement("td").addText("'" + line1 + "' Error in " + phase + ": " + e.getMessage());
		}

		return noerror;
	}

	/**
	 * Interpret the substructure/molecule
	 * 
	 * @param point The JTherGas structure that parses the lines
	 * @param row   The row element of the table
	 * @param info  The supplementary information
	 * @return The JThermodynamics2DSubstructureThermodynamics (null if error in
	 *         parsing)
	 */
	private static JsonObject interpretMoleculeStructure(JThermgasThermoStructureDataPoint point, Element row,
			JsonObject info) {
		String structure = point.getStructure().getNancyLinearForm();
		String molname = point.getStructure().getNameOfStructure();
		HashSet<MetaAtomInfo> metaatoms = new HashSet<MetaAtomInfo>();
		StringToAtomContainer convert = new StringToAtomContainer(metaatoms);
		String specclass = info.get(ClassLabelConstants.JThermodynamicsSpeciesSpecificationType).getAsString();
		String form = DatasetOntologyParseBase.getAltLabelFromAnnotation(specclass);
		AtomContainer molecule;
		JsonObject species2dstructure = null;
		try {
			molecule = convert.stringToAtomContainer(form, structure);
			molecule.setID(molname);
			species2dstructure = GenerateJThermodynamics2DSpeciesStructure.generate(molecule);
			row.addElement("td").addText(structure);
		} catch (ThermodynamicComputeException e) {
			row.addElement("td").addText("Error in parse");
			e.printStackTrace();
		} catch(Exception e) {
			System.out.println("interpretMoleculeStructure: exception" + e.getMessage());
			e.printStackTrace();
		}
		return species2dstructure;

	}

	/**
	 * Interpret the Benson Rule
	 * 
	 * @param point The JTherGas structure that parses the lines
	 * @param row   The row element of the table
	 * @param info  The supplementary information
	 * @return The JThermodynamics2DSubstructureThermodynamics (null if error in
	 *         parsing)
	 */
	public static JsonObject interpretBensonRuleThermodynamics(JsonObject parsed, Element table, JsonObject info) {
		JsonObject bensonrule = CreateDocumentTemplate
				.createTemplate("dataset:ThermodynamicBensonRuleDefinitionDataSet");
		JsonObject lines = parsed.get(ClassLabelConstants.RepositoryThermoPartitionBlock).getAsJsonObject();
		String line1 = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine1).getAsString();
		String line1a = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine1a).getAsString();
		String line2 = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine2).getAsString();
		String line3 = lines.get(ClassLabelConstants.ThermodynamicsTherGasLine3).getAsString();

		Element row = table.addElement("tr");
		double positionD = 0;
		try {
			positionD = lines.get(ClassLabelConstants.Position).getAsDouble();
			int group = (int) positionD;
			JThergasThermoStructureGroupPoint point = new JThergasThermoStructureGroupPoint();

			boolean line1aB = false;
			if (line1a.length() > 0) {
				line1aB = true;
			}

			point.parse(line1, line1a, line2, line3, line1aB, group, group);
			JsonObject bensonrulestructure = bensonrule.get(ClassLabelConstants.JThermodynamicsBensonRuleStructure)
					.getAsJsonObject();
			interpretBensonRuleStructure(point, bensonrulestructure, row);
			String nameString = bensonrulestructure.get(ClassLabelConstants.BensonRuleDatabaseReference).getAsString();
			bensonrule.addProperty(ClassLabelConstants.ShortDescription, nameString);
			JsonObject bensonrulethermo = bensonrule.get(ClassLabelConstants.JThermodynamicStandardThermodynamics)
					.getAsJsonObject();
			interpretStandardThermodynamics(point, bensonrulethermo, info, row);

		} catch (JThergasReadException e) {
			bensonrule = null;
			row.addElement("td").addText("Error in parse: " + positionD + " first line: " + line1);
			// e.printStackTrace();
		} catch (NumberFormatException e) {
			bensonrule = null;
			row.addElement("td")
					.addText("Error in parse: position (number exception): " + positionD + " first line: " + line1);
			// e.printStackTrace();
		}

		return bensonrule;
	}

	/**
	 * @param point
	 * @param bensonrulethermo
	 * @param info
	 * @param row
	 */
	private static void interpretStandardThermodynamics(JThermgasThermoStructureDataPoint point,
			JsonObject bensonrulethermo, JsonObject info, Element row) {
		JThergasThermoData thermodynamics = point.getThermodynamics();
		// Enthalpy
		JsonObject enthalpyobject = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicStandardEnthalpy");
		bensonrulethermo.add(ClassLabelConstants.ThermodynamicStandardEnthalpy, enthalpyobject);
		JsonObject enthalpyspec = info.get(ClassLabelConstants.ParameterSpecificationEnthalpy).getAsJsonObject();
		double standardEnthalpy = thermodynamics.getStandardEnthalpy();
		String enthalpyS = Double.toString(standardEnthalpy);
		enthalpyobject.add(ClassLabelConstants.ParameterSpecification, enthalpyspec);
		enthalpyobject.addProperty(ClassLabelConstants.ValueAsString, enthalpyS);
		enthalpyobject.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");
		row.addElement("td").addText(enthalpyS);
		// Entropy
		JsonObject entropyobject = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicStandardEntropy");
		bensonrulethermo.add(ClassLabelConstants.ThermodynamicStandardEntropy, entropyobject);
		JsonObject entropyspec = info.get(ClassLabelConstants.ParameterSpecificationEntropy).getAsJsonObject();
		double standardEntropy = thermodynamics.getStandardEntropy();
		String entropyS = Double.toString(standardEntropy);
		entropyobject.add(ClassLabelConstants.ParameterSpecification, entropyspec);
		entropyobject.addProperty(ClassLabelConstants.ValueAsString, entropyS);
		entropyobject.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");
		row.addElement("td").addText(entropyS);

		// Heat Capacity and temperature
		JsonObject heatcapacityspec = info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity)
				.getAsJsonObject();
		bensonrulethermo.add(ClassLabelConstants.ParameterSpecificationHeatCapacity, heatcapacityspec);
		JsonObject temperaturespec = info.get(ClassLabelConstants.ParameterSpecificationTemperature).getAsJsonObject();
		bensonrulethermo.add(ClassLabelConstants.ParameterSpecificationTemperature, temperaturespec);

		String temperatures[] = bensonTemperatureSortedArray(info);
		JsonArray cpatTarray = new JsonArray();
		bensonrulethermo.add(ClassLabelConstants.ThermodynamicCpAtTemperature, cpatTarray);
		double[] cpValues = thermodynamics.getCpValues();
		for (int i = 0; i < temperatures.length; i++) {
			if (i < cpValues.length) {
				JsonObject cpatT = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicCpAtTemperature");
				cpatT.addProperty(ClassLabelConstants.ThermodynamicTemperature, temperatures[i]);
				String cpS = Double.toString(cpValues[i]);
				cpatT.addProperty(ClassLabelConstants.ThermodynamicHeatCapacityValue, cpS);
				cpatT.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");
				cpatTarray.add(cpatT);
			}
		}
	}

	/**
	 * The list of sorted Benson temperatures from the Activity info
	 * 
	 * @param info The activity information
	 * @return The ordered list of temperatures as strings.
	 * 
	 *         The JThermodynamicBensonTemperatures is extracted from the info Each
	 *         element is interpreted as a double. The list is then sorted and
	 *         converted back to a list of strings
	 */
	private static String[] bensonTemperatureSortedArray(JsonObject info) {
		JsonArray tempsJ = info.get(ClassLabelConstants.JThermodynamicBensonTemperatures).getAsJsonArray();
		double tempsD[] = new double[tempsJ.size()];
		for (int i = 0; i < tempsJ.size(); i++) {
			String tempS = tempsJ.get(i).getAsString();
			double tempD = Double.valueOf(tempS);
			tempsD[i] = tempD;
		}
		Arrays.sort(tempsD);
		String tempsS[] = new String[tempsD.length];
		for (int i = 0; i < tempsD.length; i++) {
			String tempS = Double.toString(tempsD[i]);
			tempsS[i] = tempS;
		}
		return tempsS;
	}

	/**
	 * @param point               The JThergasThermoStructureGroupPoint
	 * @param bensonrulestructure The JThermodynamicsBensonRuleStructure to filled
	 *                            in
	 * @param row                 The Element row
	 */
	private static void interpretBensonRuleStructure(JThergasThermoStructureGroupPoint point,
			JsonObject bensonrulestructure, Element row) {
		String centerAtomTypeS = point.getCenterAtomTypeS();
		HashSet<JThergasGroupElement> groupElements = point.getGroupElements();

		bensonrulestructure.addProperty(ClassLabelConstants.JThermodynamicsBensonCenterAtom, centerAtomTypeS);
		JsonArray bensonatoms = bensonrulestructure
				.get(ClassLabelConstants.JThermodynamicsBensonConnectionWithMultiplicity).getAsJsonArray();
		for (JThergasGroupElement element : groupElements) {
			String name = element.getGroupElementName();
			int multiplicityI = element.getNumberOfElements();
			String multiplicityS = Integer.toString(multiplicityI);
			JsonObject connection = CreateDocumentTemplate
					.createTemplate("dataset:JThermodynamicsBensonConnectionWithMultiplicity");
			connection.addProperty(ClassLabelConstants.ThermodynamicBensonMultiplicity, multiplicityS);
			connection.addProperty(ClassLabelConstants.JThermodynamicsBensonConnectingAtom, name);
			bensonatoms.add(connection);
		}
		String bensonrulename = bensonRuleCanonicalName(bensonrulestructure);
		bensonrulestructure.addProperty(ClassLabelConstants.BensonRuleDatabaseReference, bensonrulename);
		row.addElement("td").addText(bensonrulename);
	}

	/**
	 * Generate Benson rule canonical name.
	 * 
	 * @param structure the JThermodynamicsBensonRuleStructure
	 * @return The canonical Benson Group name
	 */
	public static String bensonRuleCanonicalName(JsonObject structure) {
		ArrayList<JThergasGroupElement> sorted = orderedListOfJThergasGroupElements(structure);
		String center = structure.get(ClassLabelConstants.JThermodynamicsBensonCenterAtom).getAsString();
		String canonicalName = center;
		for (JThergasGroupElement element : sorted) {
			String name = element.getGroupElementName();
			int mult = element.getNumberOfElements();
			canonicalName += "-(" + name + ")";
			if (mult > 1) {
				canonicalName += "/" + mult;
			}
		}
		return canonicalName;
	}

	/**
	 * Extract JThergasGroupElement from JThermodynamicsBensonRuleStructure
	 * 
	 * @param structure the JThermodynamicsBensonRuleStructure
	 * @return ordered list of JThergasGroupElement
	 */
	public static ArrayList<JThergasGroupElement> orderedListOfJThergasGroupElements(JsonObject structure) {
		ArrayList<JThergasGroupElement> lst = new ArrayList<JThergasGroupElement>();
		JsonArray elements = structure.get(ClassLabelConstants.JThermodynamicsBensonConnectionWithMultiplicity)
				.getAsJsonArray();
		for (int i = 0; i < elements.size(); i++) {
			JsonObject element = elements.get(i).getAsJsonObject();
			String name = element.get(ClassLabelConstants.JThermodynamicsBensonConnectingAtom).getAsString();
			name = name.toLowerCase();
			String multS = element.get(ClassLabelConstants.ThermodynamicBensonMultiplicity).getAsString();
			int mult = Integer.valueOf(multS);
			JThergasGroupElement groupelement = new JThergasGroupElement(name, mult);
			lst.add(groupelement);
		}
		Collections.sort(lst);
		return lst;
	}
}
