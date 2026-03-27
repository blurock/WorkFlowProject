package info.esblurock.background.services.jthermodynamics.disassociation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;
import org.openscience.cdk.isomorphism.mcss.RMap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.molecule.DatasetMoleculeUtilities;
import info.esblurock.background.services.dataset.parameters.ParameterUtilities;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.disassociation.DisassociationEnergy;
import thermo.data.structure.structure.AtomCounts;
import thermo.data.structure.structure.StructureAsCML;
import thermo.data.structure.structure.matching.GetSubstructureMatches;

public class CalculateThermodynamicsForDisassociationEnergy {

    public static JsonObject calculate(JsonObject info) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("CalculateThermodynamicsForDisassociationEnergy");
        if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
            JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
            String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);

            if (molecule != null) {
                response = calculate(maintainer, dataset, molecule, info, document);
            } else {
                response = StandardResponse.standardServiceResponse(document, "Problem converting molecules", null);
            }
        } else {
            String errorS = "No Collection Set Record found";
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }
        return response;
    }

    public static JsonObject calculate(String maintainer, String dataset, IAtomContainer radical, JsonObject info, Document document) {
        Element body = MessageConstructor.isolateBody(document);
        body.addElement("div").addText("Maintainer      : " + maintainer);
        body.addElement("div").addText("dataset         : " + dataset);
        JsonObject response = null;
        GetSubstructureMatches matches = new GetSubstructureMatches();
        
        JsonArray disassociationCollection = FindDisassociationEnergyCollection
                .getTotalDisassociationEnergyCollection(document,maintainer, dataset);
        if (disassociationCollection != null) {
            ArrayList<DisassociationEnergyWithAtomCounts> structureCollection = FindDisassociationEnergyCollection
                    .findDisassociationEnergy(disassociationCollection);
            Collections.sort(structureCollection);
            DisassociationEnergyWithAtomCounts match = findStructureMatch(structureCollection, matches, radical);
            if (match != null) {
                Double energyD = match.getDisassociationEnergy().getDisassociationEnergy();
                String matchname = match.getMoleculeID();
                body.addElement("div").addText("Structure            : " + matchname);
                body.addElement("div").addText("Disassociation Energy: " + energyD.toString());
                JsonObject disassociationmatch = findCorrespondence(match, disassociationCollection);
                if(disassociationmatch != null) {
                JsonObject contribution = convertJThermodynamicsDisassociationEnergyOfStructureToContribution(
                        disassociationmatch, info);
                String name = "Disassociation Energy (derived from base: " + matchname + ")";
                        contribution.addProperty(ClassLabelConstants.DescriptionTitle, name);
                JsonArray arr = new JsonArray();
                arr.add(contribution);
                response = StandardResponse.standardServiceResponse(document, "Disassociation Energy Found",
                        arr);
                } else {
                    response = StandardResponse.standardErrorResponse(document, "Disassociation Energy Error: No Corresponding structure found for radical", null);
                }
            } else {
                response = StandardResponse.standardErrorResponse(document, "Disassociation Energy Error: No Corresponding structure found for radical", null);
            }
        } else {
            response = StandardResponse.standardErrorResponse(document,
                    "No disassociation energy structures in database, check Collection dataset setup", null);
        }
        return response;
    }

    private static JsonObject convertJThermodynamicsDisassociationEnergyOfStructureToContribution(
            JsonObject disassociationmatch, JsonObject info) {
        JsonObject enthalpyparameter = disassociationmatch.get(ClassLabelConstants.JThermodynamicDisassociationEnergy)
                .getAsJsonObject();
        String enthalpyS = enthalpyparameter.get(ClassLabelConstants.ValueAsString).getAsString();
        JsonObject spec = enthalpyparameter.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject();
        JsonObject unitspec = spec.get(ClassLabelConstants.ValueUnits).getAsJsonObject();
        String enthalpyspec = unitspec.get(ClassLabelConstants.UnitsOfValue).getAsString();
        double enthalpy = Double.parseDouble(enthalpyS);
        JsonObject contribution = ParameterUtilities.parameterWithEnthalpy(enthalpyspec, enthalpy,
                ClassLabelConstants.ParameterSpecificationEnthalpy, info);
        contribution.add(ClassLabelConstants.ChemConnectThermodynamicsDatabase, disassociationmatch);
        return contribution;
    }

    private static JsonObject findCorrespondence(DisassociationEnergyWithAtomCounts match,
            JsonArray disassociationCollection) {
        JsonObject disassociationmatch = null;
        String matchname = match.getMoleculeID();
        boolean notfound = false;
        for (int i = 0; i < disassociationCollection.size(); i++) {
            JsonObject energyobject = disassociationCollection.get(i).getAsJsonObject();
            JsonObject structure = energyobject.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure)
                    .getAsJsonObject();
            String name = structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            if (name.equals(matchname)) {
                notfound = false;
                disassociationmatch = energyobject;
            }
        }

        return disassociationmatch;
    }

    private static DisassociationEnergyWithAtomCounts findStructureMatch(
            ArrayList<DisassociationEnergyWithAtomCounts> structureCollection, GetSubstructureMatches matches,
            IAtomContainer radical) {
        DisassociationEnergyWithAtomCounts match = null;
        AtomCounts atomCounts = new AtomCounts(radical);
        DisassociationEnergyWithAtomCounts denergycounts = null;
        boolean notfound = true;
        Iterator<DisassociationEnergyWithAtomCounts> iter = structureCollection.iterator();
        while (iter.hasNext() && notfound) {
            denergycounts = iter.next();
            DisassociationEnergy denergy = denergycounts.getDisassociationEnergy();
            IAtomContainer substructure = denergy.getSubstructure();
            if (atomCounts.strictlyLessThanOrEqual(denergycounts)) {
                try {
                    List<List<RMap>> atommaps = matches.getAtomMatches(radical, substructure);
                    Iterator<List<RMap>> mapiter = atommaps.iterator();
                    while (mapiter.hasNext()) {
                        List<RMap> atommap = mapiter.next();
                        if (atommap.size() == substructure.getAtomCount()) {
                            notfound = false;
                        }
                    }
                } catch (CDKException e) {
                }
            }
            if (!notfound) {
                match = denergycounts;
            }
        }
        return match;
    }

}
