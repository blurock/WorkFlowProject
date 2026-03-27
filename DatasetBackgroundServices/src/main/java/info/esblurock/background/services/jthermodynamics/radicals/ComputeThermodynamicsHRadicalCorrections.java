package info.esblurock.background.services.jthermodynamics.radicals;

import java.io.IOException;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.parameters.ParameterUtilities;
import info.esblurock.background.services.jthermodynamics.CalculateThermodynamicsFromVibration;
import info.esblurock.background.services.jthermodynamics.bensonrules.ComputeBensonRulesForMolecule;
import info.esblurock.background.services.jthermodynamics.disassociation.CalculateThermodynamicsForDisassociationEnergy;
import info.esblurock.background.services.jthermodynamics.symmetry.DatabaseCalculateSymmetryCorrection;
import info.esblurock.background.services.servicecollection.ServiceCollectionComputeThermodynamics;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import thermo.data.structure.structure.AddHydrogenToSingleRadical;
import thermo.data.structure.translational.CalculateTranslationalCorrection;
import thermo.data.structure.utilities.MoleculeUtilities;
import thermo.exception.NotARadicalException;
import thermo.properties.SProperties;

public class ComputeThermodynamicsHRadicalCorrections {

    public static JsonObject computeHRadicalCorrections(IAtomContainer Rmolecule, JsonObject info) {
        Document document = MessageConstructor
                .startDocument("Compute Total Thermodynamic Contributions for 2D-graphical Molecule");
         Element body = MessageConstructor.isolateBody(document);
        JsonObject response = null;

        AddHydrogenToSingleRadical formRH = new AddHydrogenToSingleRadical();
        IAtomContainer RHmolecule;
        try {
            RHmolecule = formRH.convert(Rmolecule);
            MoleculeUtilities.normalizeMolecule(RHmolecule);
            
            JsonArray contributions = new JsonArray();

            JsonObject hcontribution = hydrogenRadical(body, info);
            contributions.add(hcontribution);

            JsonObject scontribution = spinContribution(body, info);
            contributions.add(scontribution);

            JsonObject tcontribution = translationContribution(RHmolecule, body, info);
            contributions.add(tcontribution);

            JsonObject bensonresponse = bensonRules(RHmolecule, document, info);
            MessageConstructor.combineBodyIntoDocument(document,
                    bensonresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
            if (bensonresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                JsonArray besoncontributions = bensonresponse.get(ClassLabelConstants.SimpleCatalogObject)
                        .getAsJsonArray();
                contributions.addAll(besoncontributions);

                JsonObject vibresponse = vibrationContributions(Rmolecule, RHmolecule, body, info);
                MessageConstructor.combineBodyIntoDocument(document,
                        vibresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
                if (vibresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                    JsonArray vibcontributions = vibresponse.get(ClassLabelConstants.SimpleCatalogObject)
                            .getAsJsonArray();
                    contributions.addAll(vibcontributions);

                    JsonObject symmresponse = symmetry(Rmolecule, document, info);
                    MessageConstructor.combineBodyIntoDocument(document,
                            symmresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
                    if (symmresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                        JsonArray symcontributions = symmresponse.get(ClassLabelConstants.SimpleCatalogObject)
                                .getAsJsonArray();
                        contributions.addAll(symcontributions);

                        JsonObject disassociation = disassociation(info);
                        MessageConstructor.combineBodyIntoDocument(document,
                                disassociation.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
                        if (disassociation.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                            JsonArray disscontributions = disassociation.get(ClassLabelConstants.SimpleCatalogObject)
                                    .getAsJsonArray();
                            contributions.addAll(disscontributions);
                        } else {
                            String dissrrormessage = "Error in computing disassociation contribution";
                            response = StandardResponse.standardErrorResponse(document, dissrrormessage,
                                    contributions);
                        }

                    } else {
                        String symmerrormessage = "Error in computing symmetry contributions";
                        response = StandardResponse.standardErrorResponse(document, symmerrormessage,
                                contributions);
                    }

                } else {
                    String viberrormessage = "Error in computing vibrational modes";
                    response = StandardResponse.standardErrorResponse(document, viberrormessage, contributions);
                }

            } else {
                String bensonerrormessage = "Error in calculating benson rules";
                response = StandardResponse.standardErrorResponse(document, bensonerrormessage, contributions);
            }

            String title = "Compute H Radical Corrections Successful";
            response = StandardResponse.standardServiceResponse(document, title, contributions);

        } catch (NotARadicalException e) {
            String errortitle = "Molecule not a radical";
            response = StandardResponse.standardServiceResponse(document, errortitle, null);
        } catch (IOException e) {
            String errortitle = "Error in converting the radical to a molecule";
            response = StandardResponse.standardServiceResponse(document, errortitle, null);
        }

        return response;
    }

    private static JsonObject hydrogenRadical(Element body, JsonObject info) {
        double hrad = -52.1;
        String hradS = "Hydrogen Radical";
        JsonObject hcontribution = ParameterUtilities.parameterWithEntropy(hrad, hradS, info);
        body.addElement("div").addText("Hydrogen Radical (Ethalpy): " + hrad);
        return hcontribution;
    }

    public static JsonObject translationContribution(IAtomContainer RHmolecule, Element body, JsonObject info) {
        Double transEntropyCorrectionD = CalculateTranslationalCorrection.calculate(RHmolecule);
        JsonObject tcontribution = ParameterUtilities.parameterWithEntropy(transEntropyCorrectionD.doubleValue(),
                "Translational Energy Correction", info);

        body.addElement("div")
                .addText("Translational Energy Correction(Entropy): " + transEntropyCorrectionD.toString());
        return tcontribution;
    }

    private static JsonObject spinContribution(Element body, JsonObject info) {
        //String gasconstantS = SProperties.getProperty("thermo.data.gasconstant.clasmolsk");
        String gasconstantS = "1.98587755";
        double gasConstant = Double.valueOf(gasconstantS).doubleValue();
        double spin = gasConstant * Math.log1p(1.0);
        Double spinD = Double.valueOf(spin);
        String spinS = "Spin Contribution (Entropy): Rln(2) = (" + gasConstant + ")*(" + Math.log1p(1.0) + ")";
        JsonObject scontribution = ParameterUtilities.parameterWithEntropy(spinD.doubleValue(), spinS, info);
        body.addElement("div").addText(spinS);

        return scontribution;
    }

    private static JsonObject vibrationContributions(IAtomContainer Rmolecule, IAtomContainer RHmolecule, Element body,
            JsonObject info) {
        Document document = MessageConstructor.startDocument("Compute Vibrational Contributions");
        return CalculateThermodynamicsFromVibration.vibrational(Rmolecule, RHmolecule, info, document);
    }

    private static JsonObject bensonRules(IAtomContainer RHmolecule, Document document, JsonObject info) {
        JsonObject response = null;

        JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
        String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
        String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();

        JsonObject bensonresponse = ComputeBensonRulesForMolecule.compute(maintainer, dataset, RHmolecule, info);
        MessageConstructor.combineBodyIntoDocument(document,
                bensonresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
        if (bensonresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonArray bensoncontributions = bensonresponse.get(ClassLabelConstants.SimpleCatalogObject)
                    .getAsJsonArray();

            String title = "Success in computing Benson rules";
            response = StandardResponse.standardServiceResponse(document, title, bensoncontributions);
        } else {
            String errormessage = "Error in Radical conversion to substituted molecule";
            response = StandardResponse.standardErrorResponse(document, errormessage, null);
        }
        return response;
    }

    public static JsonObject symmetry(IAtomContainer moleculetocompute, Document document, JsonObject info) {

        JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
        String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
        String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
        Element body = MessageConstructor.isolateBody(document);

        DatabaseCalculateSymmetryCorrection symmcorrection = new DatabaseCalculateSymmetryCorrection(maintainer,
                dataset);
        JsonArray symmetries = symmcorrection.compute(document, moleculetocompute, body, info);

        JsonObject response = StandardResponse.standardServiceResponse(document,
                "ComputeThermodynamicsFromAllSymmetries computed: " + symmetries.size(), symmetries);

        return response;
    }

    private static JsonObject disassociation(JsonObject info) {
        return CalculateThermodynamicsForDisassociationEnergy.calculate(info);
    }

}
