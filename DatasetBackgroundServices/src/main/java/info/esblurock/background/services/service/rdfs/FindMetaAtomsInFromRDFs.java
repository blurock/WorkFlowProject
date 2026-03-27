package info.esblurock.background.services.service.rdfs;

import java.io.IOException;
import java.util.ArrayList;

import org.openscience.cdk.exception.CDKException;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import thermo.data.structure.structure.MetaAtomDefinition;
import thermo.data.structure.structure.MetaAtomInfo;
import thermo.data.structure.structure.StructureAsCML;

public class FindMetaAtomsInFromRDFs extends FindRDFObjects {
	/**
	 * @param type The type of meta atom
	 * @return The array (JsonArray) of JThermodynamicsMetaAtomInfo objects
	 *         (JsonObject)
	 * 
	 *         If the database retrieval was unsuccessful, then an empty array is
	 *         returned.
	 */
	public static JsonArray getMetaAtomsByType(String object, String dataset) {
		String rdftype = "JThermodynamicsMetaAtomInfoRDF";
		JsonArray arr = new JsonArray();
		JsonObject response = findRDFFromTypeAndSubjectAttribute(rdftype, object);
		boolean success = response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean();
		if (success) {
			JsonArray rdfarr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
			for (int i = 0; i < rdfarr.size(); i++) {
				JsonObject metaatomrdf = rdfarr.get(i).getAsJsonObject();
				JsonObject metaatom = metaatomrdf.get(ClassLabelConstants.RDFJsonAsObject).getAsJsonObject();
				arr.add(metaatom);
			}
		}
		return arr;
	}

	/**
	 * @param object This is the meta atom type
	 * @return A list of all the JAVA meta atom definitions (MetaAtomDefinition).
	 *         This can be used directly for species construction.
	 * 
	 *         The list only contains those that had no errors in formation. If an
	 *         error occurred, then the element will not be included in the list.
	 * 
	 */
	public static ArrayList<MetaAtomDefinition> getMetaAtomDefinitionsByType(String object) {
		JsonArray arr = getMetaAtomsByType(object, null);
		ArrayList<MetaAtomDefinition> deflist = new ArrayList<MetaAtomDefinition>();
		if (arr != null) {
			for (int i = 0; i < arr.size(); i++) {
				JsonObject metaatom = arr.get(i).getAsJsonObject();
				JsonObject structure = metaatom.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure)
						.getAsJsonObject();
				String cml = structure.get(ClassLabelConstants.JThermodynamicsStructureAsCMLString).getAsString();
				String name = structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
				StructureAsCML structascml = new StructureAsCML(name, cml);
				String label = metaatom.get(ClassLabelConstants.JThermodynamicsMetaAtomLabel).getAsString();
				String type = metaatom.get(ClassLabelConstants.JThermodynamicsMetaAtomType).getAsString();
				MetaAtomInfo info = new MetaAtomInfo();
				info.setMetaAtomType(type);
				info.setMetaAtomName(label);
				info.setElementName(name);
				try {
					MetaAtomDefinition definition = new MetaAtomDefinition(info, structascml);
					deflist.add(definition);
				} catch (ClassNotFoundException | CDKException | IOException e) {
					e.printStackTrace();
				}
			}
		}
		return deflist;
	}

}
