package info.esblurock.background.services.dataset.molecule;

import java.util.HashSet;

import org.dom4j.Document;
import org.openscience.cdk.AtomContainer;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonObject;
import org.dom4j.Element;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import thermo.compute.utilities.StringToAtomContainer;
import thermo.data.structure.structure.MetaAtomInfo;
import thermo.exception.ThermodynamicComputeException;

public class DatasetMoleculeUtilities {
	
	public static IAtomContainer convertLinearFormToMolecule(JsonObject info) {
		String moldescription = info.get(ClassLabelConstants.JThermodynamicsStructureSpecification).getAsString();
		String spectype = info.get(ClassLabelConstants.JThermodynamicsSpeciesSpecificationType).getAsString();
		String molform = DatasetOntologyParseBase.getAltLabelFromAnnotation(spectype);
		HashSet<MetaAtomInfo> metaatoms = new HashSet<MetaAtomInfo>();
		StringToAtomContainer convertMoleculeString = new StringToAtomContainer(metaatoms);
		AtomContainer molecule = null;
		try {
			molecule = convertMoleculeString.stringToAtomContainer(molform, moldescription);
		} catch (ThermodynamicComputeException e) {
			e.printStackTrace();
		}
		return molecule;
	}
    public static JsonObject convertLinearFormToMoleculeAsResponse(JsonObject info) {
        Document document = MessageConstructor.startDocument("Convert linear form to  2D-graphical Molecule");
        Element body = MessageConstructor.isolateBody(document);
        JsonObject response = null;
        String moldescription = info.get(ClassLabelConstants.JThermodynamicsStructureSpecification).getAsString();
        String spectype = info.get(ClassLabelConstants.JThermodynamicsSpeciesSpecificationType).getAsString();
        String translate = "Interpret '" + moldescription + "' as " + spectype;
        body.addElement("div").addText(translate);
        String molform = DatasetOntologyParseBase.getAltLabelFromAnnotation(spectype);
        HashSet<MetaAtomInfo> metaatoms = new HashSet<MetaAtomInfo>();
        StringToAtomContainer convertMoleculeString = new StringToAtomContainer(metaatoms);
        AtomContainer molecule = null;
        try {
            molecule = convertMoleculeString.stringToAtomContainer(molform, moldescription);
        } catch (ThermodynamicComputeException e) {
            e.printStackTrace();
        }
        return null;
    }

}
