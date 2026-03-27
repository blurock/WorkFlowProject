package info.esblurock.background.services.jthermodynamics.radicals;

import java.io.IOException;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.structcorrections.CalculateStructureCorrection;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import thermo.data.structure.structure.AddHydrogenToSingleRadical;
import thermo.data.structure.utilities.MoleculeUtilities;
import thermo.exception.NotARadicalException;

public class ComputeThermodynamicsTHERM {

    public static JsonObject computeHRadicalCorrections(IAtomContainer Rmolecule, JsonObject info, Document document) {
        boolean noerrors = true;
        JsonObject response = null;

        MoleculeUtilities.setImplicitHydrogensToZero(Rmolecule);
        AddHydrogenToSingleRadical formRH = new AddHydrogenToSingleRadical();
        IAtomContainer RHmolecule;
        try {
            RHmolecule = formRH.convert(Rmolecule);
            MoleculeUtilities.normalizeMolecule(RHmolecule);

            JsonArray contributions = new JsonArray();

            JsonObject nonradresponse = computeNonRadicalContributions(RHmolecule, info, document);
            String message = nonradresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
            MessageConstructor.combineBodyIntoDocument(document, message);
            if (nonradresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                JsonArray nonradcontributions = nonradresponse.get(ClassLabelConstants.SimpleCatalogObject)
                        .getAsJsonArray();
                contributions.addAll(nonradcontributions);
            } else {
                noerrors = false;
            }

            JsonObject hbicontribution = computeHBICorrection(info, document);
            if (hbicontribution != null) {
                contributions.add(hbicontribution);
            } else {
                noerrors = false;
            }

            if (noerrors) {
                String title = "Successful calculation";
                response = StandardResponse.standardServiceResponse(document, title, contributions);
            } else {
                String errortitle = "Error occurred while computing with HBI contributions";
                response = StandardResponse.standardErrorResponse(document, errortitle, contributions);
            }

        } catch (NotARadicalException e) {
            
            response = computeNonRadicalContributions(Rmolecule, info, document);
            String errortitle = "Molecule not a radical";
            response = StandardResponse.standardServiceResponse(document, errortitle, null);
        } catch (IOException e) {
            String errortitle = "Error in converting the radical to a molecule";
            response = StandardResponse.standardErrorResponse(document, errortitle, null);
        }
        return response;
    }

    private static JsonObject computeHBICorrection(JsonObject info, Document document) {
        JsonObject contribution = null;
        JsonObject hbiinfo = info.deepCopy();
        hbiinfo.addProperty(ClassLabelConstants.JThermodynamicsSubstructureType, "dataset:HBISubstructure");
        JsonObject response = CalculateStructureCorrection.calculate(hbiinfo);
        String message = response.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
        MessageConstructor.combineBodyIntoDocument(document, message);
        Element body = MessageConstructor.isolateBody(document);
        if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonArray hbicontributions = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
            if (hbicontributions.size() > 0) {
                contribution = hbicontributions.get(0).getAsJsonObject();
                body.addElement("div").addText("HBI correction was added to the contributions");
            } else {
                body.addElement("div").addText("No appropriate HBI correction was found");
            }
        } else {
            body.addElement("div").addText("No HBI correction was added to the contributions");
        }
        
        return contribution;
    }

    private static JsonObject computeNonRadicalContributions(IAtomContainer RHmolecule,
            JsonObject info, Document document) {
        boolean noerrors = true;
        
        JsonArray contributions = new JsonArray();
        Element body = MessageConstructor.isolateBody(document);
        JsonObject response = null;
        JsonObject tcontribution = ComputeThermodynamicsHRadicalCorrections.translationContribution(RHmolecule, body,
                info);
        if(tcontribution != null) {
            contributions.add(tcontribution);
        } else {
            body.addElement("div").addText("Error in translational contribution");
            noerrors = false;
        }
        
        JsonObject symmresponse = ComputeThermodynamicsHRadicalCorrections.symmetry(RHmolecule, document, info);
        MessageConstructor.combineBodyIntoDocument(document,
                symmresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
        body = MessageConstructor.isolateBody(document);
        if (symmresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonArray symcontributions = symmresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
            contributions.addAll(symcontributions);
            body.addElement("div").addText(symcontributions.size() + " symmetry contributions added");
            
        } else {
            noerrors = false;
            body.addElement("div").addText("Error in computing symmetry contributions");
        }
        
        
        boolean ringerror = addSubstructureContribution(info,"dataset:RingStrainCorrectionSubstructure",contributions,document);
        boolean stericerror = addSubstructureContribution(info,"dataset:dataset:StericCorrectionSubstructure",contributions,document);
        
        noerrors = noerrors && ringerror && stericerror;
        String title = "Translational, Symmetry, Ring strain and steric successfully contributions added";
        
        if(!noerrors) {
            title = "Errors in adding Translational, Symmetry, Ring strain and steric corrections";
        }
        
        response = StandardResponse.standardServiceResponse(document, title, contributions);
        return response;
    }
    
    public static boolean addSubstructureContribution(JsonObject info, String substructure, JsonArray contributions, Document document) {
        boolean noerror = true;
        JsonObject subinfo = info.deepCopy();
        subinfo.addProperty(ClassLabelConstants.JThermodynamicsSubstructureType, substructure);
        JsonObject response = CalculateStructureCorrection.calculate(subinfo);
        String message = response.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
        MessageConstructor.combineBodyIntoDocument(document, message);
        Element body = MessageConstructor.isolateBody(document);
        if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonArray subcontributions = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
            if (subcontributions.size() > 0) {
                contributions.addAll(subcontributions);
                body.addElement("div").addText(subcontributions.size() + substructure + " correction was added to the contributions");
            } else {
                noerror = false;
                body.addElement("div").addText("No " + substructure.substring(8) + " correction was found");
            }
            
        }
        return noerror;
    }

}
