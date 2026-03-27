package info.esblurock.background.services.jthermodynamics;

import java.util.ArrayList;
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
import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.units.DatabaseUnitUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.benson.BensonThermodynamicBase;
import thermo.data.benson.HeatCapacityTemperaturePair;
import thermo.data.structure.structure.AddHydrogenToSingleRadical;
import thermo.data.structure.structure.StructureAsCML;
import thermo.data.structure.structure.matching.GetSubstructureMatches;
import thermo.data.structure.structure.vibrational.CalculateVibrationalCorrectionUtilities;
import thermo.data.structure.structure.vibrational.FrequencyCorrection;
import thermo.exception.NotARadicalException;

public class CalculateThermodynamicsFromVibration {
    static boolean vibdebug = false;
    
    static String defaultentropyUnits = "unit:J-PER-MOL-K";
    static String defaultenthalpyUnits = "unit:KiloCAL-PER-MOL";

    /**
     * @param info The input information
     * @return The response with the list of contributions
     * 
     */
    public static JsonObject computeVibrationalCorrectionsForRadical(JsonObject info) {
        Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromExternalSymmetry");
        Element body = MessageConstructor.isolateBody(document);
        JsonObject response = null;
        IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);

        if (molecule != null) {
            AddHydrogenToSingleRadical formRH = new AddHydrogenToSingleRadical();
            
            IAtomContainer RH;
            try {
                RH = formRH.convert(molecule);
            response = vibrational(molecule, RH, info, document);
           } catch (NotARadicalException e) {
                String errorS = "Error in computing vibrational calculation (species not a radical)";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
            
        } else {
            String errorS = "Error in interpreting molecule ";
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }
        return response;
    }
    
    public static JsonObject vibrational(IAtomContainer molecule, IAtomContainer RH, JsonObject info, Document document) {
        JsonObject response = null;
        Element body = MessageConstructor.isolateBody(document);
        
        if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
            JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
            String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
            body.addElement("div").addText("Maintainer      : " + maintainer);
            body.addElement("div").addText("dataset         : " + dataset);
            JsonArray structures = databaseAllVibrationalStructures(document, maintainer, dataset);
            JsonArray countsR = computeVibrationalMatchCounts(structures, molecule);
            body.addElement("div").addText("Vibrational Match counts for R: " + countsR.size());
            JsonArray countsRH = computeVibrationalMatchCounts(structures, RH);
            body.addElement("div").addText("Vibrational Match counts for RH: " + countsRH.size());
            JsonArray difference = subtractCounts(countsRH, countsR);
            body.addElement("div").addText("Differences in Vibrational matches: " + difference.size());
            if(difference.size() > 0) {
            JsonArray contributions = new JsonArray();
            Element table = body.addElement("table");
            Element header = table.addElement("tr");
            header.addElement("th").addText("Mode");
            header.addElement("th").addText("Frequency");
            header.addElement("th").addText("Symmetry");
            header.addElement("th").addText("Multiplicity");
            for (int i = 0; i < difference.size(); i++) {
                JsonObject countdiff = difference.get(i).getAsJsonObject();
                if(vibdebug) {
                    System.out.println("Count Diff =============================================");
                    System.out.println(JsonObjectUtilities.toString(countdiff));
                    System.out.println("Count Diff =============================================");                            
                }
                JsonObject contribution = convertToThermodynamicContribution(countdiff, info, table);
                if(vibdebug) {
                    System.out.println("Contribution =============================================");
                    System.out.println(JsonObjectUtilities.toString(contribution));
                    System.out.println("Contribution =============================================");                           
                }
               contributions.add(contribution);
            }
            response = StandardResponse.standardServiceResponse(document, dataset, contributions);
            } else {
                body.addElement("div").addText("No contributions due to vibrational contributions: probably a lack of structures in database ");
            }
        } else {
            String errorS = "No Collection Set Record found";
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }
        return response;
    }
    

    /**
     * The ThermodynamicContributions from the
     * JThermodynamicsVibrationalStructureWithCount
     * 
     * @param countdiff The JThermodynamicsVibrationalStructureWithCount
     * @param info      The input info with the parameter specs
     * @param table     The table forms
     * @return The ThermodynamicContributions from the
     *         JThermodynamicsVibrationalStructureWithCount
     */
    private static JsonObject convertToThermodynamicContribution(JsonObject countdiff, JsonObject info, Element table) {
        String matchesS = countdiff.get(ClassLabelConstants.ElementCount).getAsString();
        JsonObject frequencyJ = countdiff.get(ClassLabelConstants.StructureVibrationalFrequency).getAsJsonObject();
        String frequencyS = frequencyJ.get(ClassLabelConstants.ValueAsString).getAsString();
        String symmetryS = countdiff.get(ClassLabelConstants.StructureVibrationalFrequencySymmetry).getAsString();
        String modelabel = countdiff.get(ClassLabelConstants.JThermodynamicsVibrationalModeLabel).getAsString();
        Element row = table.addElement("tr");
        row.addElement("td").addText(modelabel);
        row.addElement("td").addText(frequencyS);
        row.addElement("td").addText(symmetryS);
        row.addElement("td").addText(matchesS);
        String title = "Vibrational Mode: " + modelabel + " (" + frequencyS + ", " + symmetryS + ", " + matchesS + ")";

        double matches = Double.parseDouble(matchesS);
        double frequency = Double.parseDouble(frequencyS);
        double symmetry = Double.parseDouble(symmetryS);

        BensonThermodynamicBase benson = CalculateVibrationalCorrectionUtilities.contribution(title, matches, frequency,
                symmetry);

        double entropy = benson.getStandardEntropy298();
        JsonObject entropyP = DatabaseUnitUtilities.createEmptyParameter("dataset:ThermodynamicStandardEntropy",
                defaultentropyUnits, "dataset:ImpliedDigitsUncertainty");
        entropyP.addProperty(ClassLabelConstants.ValueAsString, Double.toString(entropy));
        entropyP.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");
        ParameterUtilities.changeParameterToNewSpecification(entropyP, info,
                ClassLabelConstants.ParameterSpecificationEntropy);

        double enthalpy = benson.getStandardEnthalpy298();
        JsonObject enthalpyP = DatabaseUnitUtilities.createEmptyParameter("dataset:ThermodynamicStandardEnthalpy",
                defaultenthalpyUnits, "dataset:ImpliedDigitsUncertainty");
        enthalpyP.addProperty(ClassLabelConstants.ValueAsString, enthalpy);
        enthalpyP.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");

        JsonArray cpTpairs = new JsonArray();
        ArrayList<HeatCapacityTemperaturePair> cpsT = benson.getSetOfHeatCapacities();
        Iterator<HeatCapacityTemperaturePair> iter = cpsT.iterator();
        while (iter.hasNext()) {
            HeatCapacityTemperaturePair pair = iter.next();
            double temperature = pair.getTemperatureValue();
            double cp = pair.getHeatCapacityValue();
            JsonObject cptemppair = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicCpAtTemperature");
            cptemppair.addProperty(ClassLabelConstants.ThermodynamicTemperature, temperature);
            cptemppair.addProperty(ClassLabelConstants.ThermodynamicHeatCapacityValue, cp);
            cptemppair.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");
            cpTpairs.add(cptemppair);
        }

        JsonObject cpValueSpec = info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        JsonObject contribution = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicContributions");
        contribution.add(ClassLabelConstants.ThermodynamicCpAtTemperature, cpTpairs);
        contribution.add(ClassLabelConstants.ParameterSpecificationHeatCapacity, cpValueSpec);
        contribution.add(ClassLabelConstants.ThermodynamicStandardEnthalpy, enthalpyP);
        contribution.add(ClassLabelConstants.ThermodynamicStandardEntropy, entropyP);
        contribution.addProperty(ClassLabelConstants.DescriptionTitle, title);

        return contribution;
    }

    /**
     * The vibrational counts of the vibrational modes
     * 
     * @param structures The vibrational modes
     *                   (JThermodynamicsVibrationalStructureWithCount)
     * @param molecule   The radical molecule (assumed to be a radical)
     * @return The vibrational counts of the vibrational modes
     * 
     */
    public static JsonArray computeVibrationalMatchCounts(JsonArray structures, IAtomContainer molecule) {
        GetSubstructureMatches matches = new GetSubstructureMatches();
        FrequencyCorrection frequencyCorrection = new FrequencyCorrection();
        JsonArray vibcounts = new JsonArray();
        for (int i = 0; i < structures.size(); i++) {
            JsonObject vibstructure = structures.get(i).getAsJsonObject();
            if(vibdebug) {
                System.out
                .println("computeVibrationalMatchCounts   ------------------------------------------------------");                
            }
            String vibmode = vibstructure.get(ClassLabelConstants.JThermodynamicsVibrationalModeLabel).getAsString();
            if(vibdebug) {
            System.out.println("Mode: " + vibmode);
            }
            JsonObject structureinfo = vibstructure.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure)
                    .getAsJsonObject();
            String cmlstruct = structureinfo.get(ClassLabelConstants.JThermodynamicsStructureAsCMLString).getAsString();
            StructureAsCML vibcml = new StructureAsCML();
            vibcml.setCmlStructureString(cmlstruct);
            try {
                IAtomContainer vibmolecule = vibcml.getMolecule();
                if(vibdebug) {
                System.out.println("Vibrational Mode: atomcount=" + vibmolecule.getAtomCount());
                }
                String vibsymmetry = vibstructure.get(ClassLabelConstants.StructureVibrationalFrequencySymmetry)
                        .getAsString();
                 int nI = calculateContribution(molecule, vibmolecule, matches, vibsymmetry);
                matches.debug = false;
                if (nI != 0) {
                    JsonObject vibwithcount = vibstructure.deepCopy();
                    vibwithcount.addProperty(ClassLabelConstants.ElementCount, Integer.toString(nI));
                    vibcounts.add(vibwithcount);
                }
            } catch (CDKException e) {
                e.printStackTrace();
            }

        }

        return vibcounts;
    }

    /**
     * Count difference (RH-H) for each vibrational mode
     * 
     * @param countsRH The JThermodynamicsVibrationalStructureWithCount for the H
     *                 substituted radical (RH)
     * @param countsR  The JThermodynamicsVibrationalStructureWithCount radical (R)
     * @return The JThermodynamicsVibrationalStructureWithCount having the count
     *         difference between RH and R
     * 
     * 
     */
    private static JsonArray subtractCounts(JsonArray countsRH, JsonArray countsR) {
        JsonArray newcounts = new JsonArray();
        for (int i = 0; i < countsRH.size(); i++) {
            JsonObject RHcount = countsRH.get(i).getAsJsonObject();
            JsonObject Rcount = findInArray(RHcount, countsR);
            if (Rcount != null) {
                String RHcnt = RHcount.get(ClassLabelConstants.ElementCount).getAsString();
                String Rcnt = Rcount.get(ClassLabelConstants.ElementCount).getAsString();
                double diff = Double.parseDouble(RHcnt) - Double.parseDouble(Rcnt);
                JsonObject newcount = RHcount.deepCopy();
                newcount.addProperty(ClassLabelConstants.ElementCount, Double.toString(diff));
                newcounts.add(newcount);
            } else {
                JsonObject newcount = RHcount.deepCopy();
                String RHcnt = RHcount.get(ClassLabelConstants.ElementCount).getAsString();
                double count = Double.parseDouble(RHcnt);
                newcount.addProperty(ClassLabelConstants.ElementCount, Double.toString(count));
                newcounts.add(newcount);
            }
        }
        for (int i = 0; i < countsR.size(); i++) {
            JsonObject Rcount = countsR.get(i).getAsJsonObject();
            JsonObject RHcount = findInArray(Rcount, countsRH);
            if (RHcount == null) {
                JsonObject newcount = Rcount.deepCopy();
                String Rcnt = Rcount.get(ClassLabelConstants.ElementCount).getAsString();
                double count = Double.parseDouble(Rcnt);
                newcount.addProperty(ClassLabelConstants.ElementCount, Double.toString(-count));
                newcounts.add(newcount);
            }
        }

        return newcounts;
    }

    /**
     * find JThermodynamicsVibrationalStructureWithCount with same label in the
     * array
     * 
     * @param obj The The JThermodynamicsVibrationalStructureWithCount object
     * @param arr The array of JThermodynamicsVibrationalStructureWithCount object
     * @return The matching JThermodynamicsVibrationalStructureWithCoun (through
     *         label) in the array, null if not found
     */
    private static JsonObject findInArray(JsonObject obj, JsonArray arr) {
        // JsonObject objstruct =
        // obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
        // String name =
        // objstruct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
        String name = obj.get(ClassLabelConstants.JThermodynamicsVibrationalModeLabel).getAsString();
        JsonObject ans = null;
        int i = 0;
        while (i < arr.size() && ans == null) {
            JsonObject arrobj = arr.get(i).getAsJsonObject();
            String arrname = arrobj.get(ClassLabelConstants.JThermodynamicsVibrationalModeLabel).getAsString();
            // JsonObject arrstruct =
            // arrobj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            // String arrname =
            // arrstruct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            i++;
            if (name.equals(arrname)) {
                ans = arrobj;
            }
        }
        return ans;
    }

    /**
     * Find the contribution of the vibrational mode (through the structure of the
     * vibrational mode).
     * 
     * @param molecule    The molecule to analyse
     * @param vibmolecule The molecue of the vibrational mode
     * @param matches     The GetSubstructureMatches to determine match.
     * @param vibsymmetry The symmetry factor of the
     * @return The contribution (number of matches times the symmetry factor), if
     *         zero, the vibrational structure was not found
     * 
     */
    private static int calculateContribution(IAtomContainer molecule, IAtomContainer vibmolecule,
            GetSubstructureMatches matches, String vibsymmetry) {
        // int vibsize = vibmolecule.getAtomCount();
        List<List<RMap>> bondMatches;
        int nI = 0;
        try {
            bondMatches = matches.getBondMatches(molecule, vibmolecule);
            int n = bondMatches.size();
            if(vibdebug) {
            System.out.println("calculateContribution  Bond Matches: " + n);
            }
            if (n > 0) {
                double nD = (double) n;
                double cD = nD / Double.parseDouble(vibsymmetry);
                nI = (int) -cD;
                if(vibdebug) {
                System.out.println("Calculate contribution: " + nI);
                }
            }
        } catch (CDKException e) {
            e.printStackTrace();
        }
        return nI;
    }

    /**
     * Set of JThermodynamicsVibrationalStructureWithCount in the dataset
     * 
     * @param maintainer The maintainer of the dataset
     * @param dataset    The dataset
     * @return Set of JThermodynamicsVibrationalStructureWithCount in the dataset
     */
    public static JsonArray databaseAllVibrationalStructures(Document document, String maintainer, String dataset) {
        JsonArray definitions = null;

        String classname = "dataset:JThermodynamicsVibrationalStructure";
        String service = "ReadInDatasetWithDatasetCollectionLabel";

        JsonObject json = new JsonObject();
        JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);

        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
        json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
        json.addProperty(DatabaseServicesBase.service, service);
        JsonObject response = DatabaseServicesBase.process(json);
        MessageConstructor.combineBodyIntoDocument(document, response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
        if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            definitions = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
        } else {
            MessageConstructor.isolateBody(document).addElement("div").addText("Error in reading vibrational structures, so empty set");
        }

        return definitions;
    }

}
