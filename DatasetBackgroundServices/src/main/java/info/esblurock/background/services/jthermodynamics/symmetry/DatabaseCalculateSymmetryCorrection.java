package info.esblurock.background.services.jthermodynamics.symmetry;

import java.io.IOException;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.dataset.FindMetaAtomDefinitionsInDatasetCollection;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.structure.SetOfMetaAtomsForSubstitution;
import thermo.data.structure.structure.StructureAsCML;
import thermo.data.structure.structure.matching.SubstituteLinearStructures;
import thermo.data.structure.structure.symmetry.CalculateSymmetryCorrection;
import thermo.exception.ThermodynamicException;

public class DatabaseCalculateSymmetryCorrection {
	DatabaseCalculateExternalSymmetryCorrection externalD;
	DatabaseCalculateInternalSymmetryCorrection internalD;
	DatabaseCalculateOpticalSymmetryCorrection opticalD;
	
	String metaatomtype = "LinearStructure";
	SetOfMetaAtomsForSubstitution substitute;
	SubstituteLinearStructures linear;
	
	public DatabaseCalculateSymmetryCorrection(String maintainer, String dataset)  {
		super();
		externalD = new DatabaseCalculateExternalSymmetryCorrection(maintainer,dataset);
		Document externaldoc = externalD.getReadResponseMessages();
		internalD = new DatabaseCalculateInternalSymmetryCorrection(maintainer,dataset,externalD);
		JsonObject internalresponse = internalD.getResponseStructureInternalSymmetryRead();
		opticalD = new DatabaseCalculateOpticalSymmetryCorrection(maintainer,dataset);
		substitute = 
				FindMetaAtomDefinitionsInDatasetCollection.setUpSubstituteMetaAtoms(maintainer, dataset, metaatomtype);
		linear = new SubstituteLinearStructures(substitute);
	}
	
	public JsonArray compute(Document document, IAtomContainer molecule, Element body, JsonObject info) {
		StructureAsCML cmlstruct;
		IAtomContainer newmolecule = null;
		JsonArray combined2 = null;
		JsonObject response = null;
        Document externalmessage = externalD.getReadResponseMessages();
        MessageConstructor.combineBodyIntoDocument(document, externalmessage);
        Document internalmessage = externalD.getReadResponseMessages();
        MessageConstructor.combineBodyIntoDocument(document, internalmessage);
        String opticalmessage = opticalD.getResponseStructureOpticalSymmetryRead();
        MessageConstructor.combineBodyIntoDocument(document, opticalmessage);
		try {
			cmlstruct = new StructureAsCML(molecule);
			newmolecule = linear.substitute(cmlstruct);
			//substituteBack.substitute(newmolecule);
			JsonArray contributionsE = externalD.compute(newmolecule, body, info);
			JsonArray contributionsI = internalD.compute(newmolecule, body, info);
			JsonArray combined1 = JsonObjectUtilities.combineJsonArray(contributionsE, contributionsI);
			JsonArray contributionsO = opticalD.compute(newmolecule, body, info);
			combined2 = JsonObjectUtilities.combineJsonArray(combined1, contributionsO);
			
			
		} catch (CDKException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		
		return combined2;
	}
	
	public IAtomContainer substituteLinearAtoms(StructureAsCML struct, Element body) {
		IAtomContainer molecule = null;
		try {
			molecule = substitute.substitute(struct);
		} catch (ClassNotFoundException | CDKException | IOException e1) {
			body.addElement("div").addText("Unsuccesful attempt to substitute BensonAtom meta atoms in molecule");
		}
		return molecule;

	}
		
}
