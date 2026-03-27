package info.esblurock.background.services.jthermodynamics.symmetry;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;

import javax.xml.catalog.Catalog;

import org.openscience.cdk.AtomContainer;
import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;
import org.dom4j.Document;
import org.dom4j.Element;
import org.dom4j.Node;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.utilities.XMLUtilityRoutines;
import info.esblurock.background.services.jthermodynamics.structure.GenerateJThermodynamics2DSpeciesStructure;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.structure.StructureAsCML;

public class InterpretSymmetryBlock {

	/**
	 * Create JThermodynamicsSymmetryStructureDefinition
	 * 
	 * @param xml The XML representation in string form of
	 *            JThermodynamicsSymmetryStructureDefinition
	 * @return The JsonObject representation of
	 *         JThermodynamicsSymmetryStructureDefinition
	 */
	public static JsonObject interpret(String xmlString, Element table) {
	    Document xml = XMLUtilityRoutines.convertStringToXMLDocument(xmlString);
		return interpret(xml,table);
	}

	/**
	 * Create JThermodynamicsSymmetryStructureDefinition
	 * 
	 * @param xml The XML representation of
	 *            JThermodynamicsSymmetryStructureDefinition
	 * @return The JsonObject representation of
	 *         JThermodynamicsSymmetryStructureDefinition
	 */
	public static JsonObject interpret(Document xml, Element table) {
		Element root = xml.getRootElement();
		List<Node> nodesymdeflst = root.content();
		JsonObject symmetry = interpretSymmetry(root);
		String symmetryfactor = symmetry.get(ClassLabelConstants.SymmetryFactorOfStructure).getAsString();
		String symname = symmetry.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
		String symtype = symmetry.get(ClassLabelConstants.StructureSymmetryType).getAsString();
		String label = symmetry.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
		table.addElement("td").addText(symname);
		table.addElement("td").addText(symtype);
		JsonObject speciesstructure = interpretStructure(root,table);
		String structname = speciesstructure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
		String shortdescriptionString = label + ": " + symmetryfactor + " (" + structname +")";
		table.addElement("td").addText(symmetryfactor);
		JsonObject catalog = CreateDocumentTemplate
				.createTemplate("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet");
		catalog.addProperty(ClassLabelConstants.ShortDescription, shortdescriptionString);
		catalog.add(ClassLabelConstants.JThermodynamicsSymmetryDefinition, symmetry);
		catalog.add(ClassLabelConstants.JThermodynamics2DSpeciesStructure, speciesstructure);
		return catalog;
	}

	/** Extract JThermodynamics2DSpeciesStructure from the xml document
	 * 
	 * @param doc The document where the "molecule" structure is found
	 * @param table A table created for the output response, this routine adds an element to the row.
	 * @return The JThermodynamics2DSpeciesStructure created from the document
	 * 
	 * The "molecule" element is a CML representation of the molecule. This routine uses
	 * GenerateJThermodynamics2DSpeciesStructure to create the full JThermodynamics2DSpeciesStructure
	 * 
	 */
	private static JsonObject interpretStructure(Element doc, Element table) {
		JsonObject structure = null;
		Element molelement = doc.element("molecule");
		
		String strObject = XMLUtilityRoutines.convertXMLToString(molelement);
		//String strObject = XMLUtilityRoutines.retrieveAsStringFromDocument(doc,"molecule");
		try {
			StructureAsCML cmlstruct = new StructureAsCML("Name", strObject);
			String name = cmlstruct.getNameOfStructure();
			table.addElement("td").addText(name);
			structure = GenerateJThermodynamics2DSpeciesStructure.generate(cmlstruct.getMolecule());

		} catch (CDKException ex) {
		    
		   table.addElement("td").addText("Error in interpreting structure: " + ex.getMessage());
		}
		return structure;
	}

	/** Extract JThermodynamicsSymmetryDefinition from the document
	 * 
	 * @param doc The xml document where the JThermodynamicsSymmetryDefinition is extracted
	 * @return the JThermodynamicsSymmetryDefinition structure
	 * 
	 * This basically, using  XMLUtilityRoutines, translates the XML represenation of JThermodynamicsSymmetryDefinition
	 * to a JsonObject representation of JThermodynamicsSymmetryDefinition.
	 */
	static JsonObject interpretSymmetry(Element doc) {
		JsonObject json = XMLUtilityRoutines.convertXMLToJsonObject(doc);
		JsonObject top = json.get("dataset:JThermodynamicsSymmetryDefinitionFormat").getAsJsonObject();
		//JsonObject symmetry = XMLUtilityRoutines.getJsonObjectFromDocument(doc, ClassLabelConstants.JThermodynamicsSymmetryDefinition);
		JsonObject symmetry = top.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
		if (!symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryNodeGroupDefinition).isJsonArray()) {
			JsonObject nodedef = symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryNodeGroupDefinition)
					.getAsJsonObject();
			JsonArray arr = new JsonArray();
			arr.add(nodedef);
			symmetry.add(ClassLabelConstants.JThermodynamicsSymmetryNodeGroupDefinition, arr);
		}
		return symmetry;
	}

}
