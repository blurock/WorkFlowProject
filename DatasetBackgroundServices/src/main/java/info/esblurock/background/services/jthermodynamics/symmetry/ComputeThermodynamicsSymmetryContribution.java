package info.esblurock.background.services.jthermodynamics.symmetry;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.parameters.ParameterUtilities;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.units.DatabaseUnitUtilities;
import thermo.data.benson.BensonThermodynamicBase;
import thermo.data.benson.SetOfBensonThermodynamicBase;
import thermo.data.structure.structure.symmetry.CalculateExternalSymmetryCorrection;
import thermo.data.structure.structure.symmetry.CalculateInternalSymmetryCorrection;
import thermo.data.structure.structure.symmetry.DetermineExternalSymmetryFromSingleDefinition;
import thermo.data.structure.structure.symmetry.SymmetryDefinition;
import thermo.exception.ThermodynamicException;
import thermo.properties.SProperties;

public class ComputeThermodynamicsSymmetryContribution {

    /**
     * @param maintainer The maintainer of the dataset (used to find the external
     *                   symmetry elements)
     * @param dataset    The dataset (used to find the external symmetry elements)
     * @param molecule   The molecule to analyze
     * @param info       information from input (used for units of entropy)
     * @return The response with an array of ThermodynamicContributions
     */
    public static JsonObject computeExternalSymmetry(String maintainer, String dataset, IAtomContainer molecule,
            JsonObject info) {
        Document document = MessageConstructor.startDocument("ComputeBensonRulesForMolecule");
        Element body = MessageConstructor.isolateBody(document);
        body.addElement("div").addText("Maintainer    : " + maintainer);
        body.addElement("div").addText("dataset       : " + dataset);
        body.addElement("div").addText("Symmetry type : " + "dataset:StructureExternalSymmetry");
        JsonObject response = null;

        DatabaseCalculateExternalSymmetryCorrection determineTotal = new DatabaseCalculateExternalSymmetryCorrection(
                maintainer, dataset);
        Document readdocument =  determineTotal.getReadResponseMessages();
        MessageConstructor.combineBodyIntoDocument(document,readdocument);
        JsonArray contributions = determineTotal.compute(molecule, body, info);
        String message = contributions.size() + " Contributions found to external symmetry";
        response = StandardResponse.standardServiceResponse(document, message,
                contributions);
        return response;
    }

    /**
     * @param maintainer The maintainer of the dataset (used to find the external
     *                   symmetry elements)
     * @param dataset    The dataset (used to find the external symmetry elements)
     * @param molecule   The molecule to analyze
     * @param info       information from input (used for units of entropy)
     * @return response with Thermo Contribution
     */
    public static JsonObject computeFromSymmetryObject(String maintainer, String dataset, IAtomContainer molecule,
            JsonObject info) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("ComputeBensonRulesForMolecule");
        Element body = MessageConstructor.isolateBody(document);
        body.addElement("div").addText("Maintainer      : " + maintainer);
        body.addElement("div").addText("dataset         : " + dataset);
        body.addElement("div").addText("Symmetry type   : " + "dataset:StructureExternalSymmetry");
        String symmname = info.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
        String symmetrytype = "dataset:StructureExternalSymmetry";
        body.addElement("div").addText("Symmetry Element : " + symmname);
        DetermineExternalSymmetryFromSingleDefinition single = new DetermineExternalSymmetryFromSingleDefinition();
        JsonObject symjson = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSingleSymmetryDefinition(maintainer,
                dataset, symmetrytype, symmname);
        SymmetryDefinition symmetry = ExtractSetOfSymmetryDefinitionsFromDataset.convertToSymmetryDefinition(symjson);
        int result;
        try {
            result = single.determineSymmetry(symmetry, molecule);
            double symmD = (double) result;
            //String gasconstantS = SProperties.getProperty("thermo.data.gasconstant.clasmolsk");
            String gasconstantS ="1.98587755";
            double gasConstant = Double.valueOf(gasconstantS).doubleValue();
            double correction = -gasConstant * Math.log(symmD);
            body.addElement("div").addText("Symmetry      : " + symmD);
            body.addElement("div").addText("Entropy       : " + correction);
            JsonObject contribution = ParameterUtilities.parameterWithEntropy(correction, symmetry.getElementName(),
                    info);
            contribution.add(ClassLabelConstants.ChemConnectThermodynamicsDatabase, symjson);
            String message = "External Symmetry contribution of " + symmetry.getElementName() + " = " + correction;
            response = StandardResponse.standardServiceResponse(document, message, contribution);
        } catch (CDKException e) {
            response = StandardResponse.standardErrorResponse(document, "Error External Symmetry", null);
        }
        return response;
    }

    /**
     * @param maintainer The maintainer of the dataset (used to find the external
     *                   symmetry elements)
     * @param dataset    The dataset (used to find the external symmetry elements)
     * @param molecule   The molecule to analyze
     * @param info       information from input (used for units of entropy)
     * @return The response with an array of ThermodynamicContributions
     */
    public static JsonObject computeInternalSymmetry(String maintainer, String dataset, IAtomContainer molecule,
            JsonObject info) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromInternalSymmetry");
        Element body = MessageConstructor.isolateBody(document);
        body.addElement("div").addText("Maintainer      : " + maintainer);
        body.addElement("div").addText("dataset         : " + dataset);
        body.addElement("div").addText("Symmetry type   : " + "dataset:StructureInternalSymmetry");
        DatabaseCalculateExternalSymmetryCorrection external = new DatabaseCalculateExternalSymmetryCorrection(
                maintainer, dataset);
        Document externaldocument = external.getReadResponseMessages();
        MessageConstructor.combineBodyIntoDocument(document, externaldocument);
        if (external.getStructureExternalSymmetry().size() > 0) {
            DatabaseCalculateInternalSymmetryCorrection internal = new DatabaseCalculateInternalSymmetryCorrection(
                    maintainer, dataset, external);
            if (internal.getStructureInternalSymmetry().size() > 0) {
                JsonObject internalresponse = internal.getResponseStructureInternalSymmetryRead();
                String internalmessage = internalresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
                MessageConstructor.combineBodyIntoDocument(document,internalmessage);
                JsonArray contributions = internal.compute(molecule, body, info);
                response = StandardResponse.standardServiceResponse(document, "Found External Internal Element",
                        contributions);
            } else {
                String errormessage = "No internal symmetries defined: Check Collection dataset definition";
                response = StandardResponse.standardErrorResponse(document, errormessage, null);
            }
        } else {
            String errormessage = "No external symmetries defined: Check Collection dataset definition";
            response = StandardResponse.standardErrorResponse(document, errormessage, null);
        }
        return response;
    }

    /**
     * @param maintainer The maintainer of the dataset (used to find the optical
     *                   symmetry elements)
     * @param dataset    The dataset (used to find the optical symmetry elements)
     * @param molecule   The molecule to analyze
     * @param info       information from input (used for units of entropy)
     * @return The response with an array of ThermodynamicContributions
     */
    public static JsonObject computeOpticalSymmetry(String maintainer, String dataset, IAtomContainer molecule,
            JsonObject info) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromOpticalSymmetry");
        Element body = MessageConstructor.isolateBody(document);
        body.addElement("div").addText("Maintainer      : " + maintainer);
        body.addElement("div").addText("dataset         : " + dataset);
        body.addElement("div").addText("Symmetry type   : " + "dataset:StructureOpticalSymmetry");
        JsonArray contributions = new JsonArray();
        DatabaseCalculateOpticalSymmetryCorrection optical = new DatabaseCalculateOpticalSymmetryCorrection(maintainer,
                dataset);
        contributions = optical.compute(molecule, body, info);
        if (contributions != null) {
            response = StandardResponse.standardServiceResponse(document, "Found Optical Isomer Element",
                    contributions);
        } else {
            response = StandardResponse.standardErrorResponse(document,
                    "No optical symmetry elements in database: check Collection dataset setup", null);
        }
        return response;
    }

    /**
     * Find JThermodynamicsSymmetryStructureDefinition by name
     * 
     * @param arr     The array of JThermodynamicsSymmetryStructureDefinition
     * @param symname The element name to look for
     * @return The JThermodynamicsSymmetryStructureDefinition element
     */
    public static JsonObject findSymmetryObjectInSet(JsonArray arr, String symname) {
        boolean notdone = true;
        JsonObject symmetry = null;
        for (int i = 0; i < arr.size() && notdone; i++) {
            symmetry = arr.get(i).getAsJsonObject();
            JsonObject symdef = symmetry.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
            String name = symdef.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
            if (name.equals(symname)) {
                notdone = false;
            }
        }
        if (notdone) {
            symmetry = null;
        }
        return symmetry;
    }
}
