package info.esblurock.background.services.jthermodynamics;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.molecule.DatasetMoleculeUtilities;
import info.esblurock.background.services.jthermodynamics.bensonrules.ComputeBensonRulesForMolecule;
import info.esblurock.background.services.jthermodynamics.radicals.ComputeThermodynamicsHRadicalCorrections;
import info.esblurock.background.services.jthermodynamics.radicals.ComputeThermodynamicsTHERM;
import info.esblurock.background.services.jthermodynamics.symmetry.DatabaseCalculateSymmetryCorrection;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import thermo.data.structure.structure.AddHydrogenToSingleRadical;
import thermo.data.structure.utilities.MoleculeUtilities;

public class ComputeTotalThermodynamics {

    public static JsonObject calculateTherGasThermodynamics(JsonObject info) {
        Document document = MessageConstructor
                .startDocument("Compute Total Thermodynamic Contributions for 2D-graphical Molecule");
        JsonObject response = null;
        JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
        String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
        String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
        IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
        if (molecule != null) {
            response = calculateTherGasThermodynamics(maintainer, dataset, molecule, info, document);
        } else {
            String errorS = "Error in interpreting molecule";
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }
        return response;
    }

    public static JsonObject calculateTherGasThermodynamics(String maintainer, String dataset,
            IAtomContainer moleculetocompute, JsonObject info, Document document) {
        Element body = MessageConstructor.isolateBody(document);
        body.addElement("div").addText("Maintainer      : " + maintainer);
        body.addElement("div").addText("dataset         : " + dataset);

        MoleculeUtilities.setImplicitHydrogensToZero(moleculetocompute);
        JsonObject response = null;
        AddHydrogenToSingleRadical formRH = new AddHydrogenToSingleRadical();
        if (formRH.isARadical(moleculetocompute)) {
            body.addElement("h2").addText("Compute Thermodynamics For Radical");
            response = ComputeThermodynamicsHRadicalCorrections.computeHRadicalCorrections(moleculetocompute, info);
        } else {
            body.addElement("h2").addText("Compute Thermodynamics For Non-Radical");
            response = computeThermodynamicsForMolecule(maintainer, dataset, moleculetocompute, info, document);
        }

        return response;
    }

    private static JsonObject computeThermodynamicsForMolecule(String maintainer, String dataset,
            IAtomContainer moleculetocompute, JsonObject info, Document document) {
        Element body = MessageConstructor.isolateBody(document);

        JsonObject response = ComputeBensonRulesForMolecule.compute(maintainer, dataset, moleculetocompute, info);
        MessageConstructor.combineBodyIntoDocument(document,
                response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
        if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonArray bensoncontributions = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
            DatabaseCalculateSymmetryCorrection symmcorrection = new DatabaseCalculateSymmetryCorrection(maintainer,
                    dataset);
            JsonArray symmetries = symmcorrection.compute(document, moleculetocompute, body, info);
            bensoncontributions.addAll(symmetries);
            String title = "Total Contribution";
            response = StandardResponse.standardServiceResponse(document, title, bensoncontributions);
        }

        return response;
    }

    public static JsonObject calculateTHERMThermodynamics(JsonObject info) {
        Document document = MessageConstructor
                .startDocument("Compute Total Thermodynamic Contributions for 2D-graphical Molecule");
        JsonObject response = null;
        try {
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
            if (molecule != null) {
                response = ComputeThermodynamicsTHERM.computeHRadicalCorrections(molecule, info, document);
            } else {
                String errorS = "Error in interpreting molecule";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
        } catch (Exception ex) {
            String errorS = "Fundamental Error in HBI calculation: \n" + ex.getMessage();
            ex.printStackTrace();
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }
        return response;
    }

}
