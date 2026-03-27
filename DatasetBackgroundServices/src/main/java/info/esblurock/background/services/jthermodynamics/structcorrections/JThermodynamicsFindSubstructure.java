package info.esblurock.background.services.jthermodynamics.structcorrections;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;
import org.openscience.cdk.isomorphism.mcss.RMap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.parameters.ParameterUtilities;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import thermo.data.structure.structure.matching.GetSubstructureMatches;

public class JThermodynamicsFindSubstructure {

    /**
     * @param species The species in the JThermodynamics2DSpeciesStructureDatabase form
     * @param substructures A JsonArray of JThermodynamics2DSubstructureThermodynamicsDatabase (read from the database)
     * @return the best (largest) JThermodynamics2DSubstructureThermodynamicsDatabase from the JsonArray
     * @throws CDKException This is thrown if there is a problem in converting the JThermodynamics2DSubstructureThermodynamics to IAtomContainer
     * 
     * This top level routine converts all JThermodynamics2DSubstructureThermodynamicsDatabase and JThermodynamics2DSpeciesStructureDatabase JsonObjects
     * to the JThermodynamicsAtomCountSet class (which extends the AtomCounts) class. 
     * 
     * The AtomCounts class is used to order the list of structures.
     * 
     * GetSubstructureMatches is used to do the mappings between the species and the substructure.
     * 
     * The work routine is findLargestSubstructure.
     * 
     */
    public static JsonObject findLargestSubstructure(JsonObject species, JsonArray substructures) throws CDKException {
        JThermodynamicsAtomCountSet speciessubstructure = new JThermodynamicsAtomCountSet(species);
        ArrayList<JThermodynamicsAtomCountSet> setofsubstructures = convertToSetOfSubStructures(substructures);

        JThermodynamicsAtomCountSet match = findStructureMatch(speciessubstructure, setofsubstructures);
        JsonObject result = null;
        if (match != null) {
            result = match.getJsonObjectSubstructure();
        }
        return result;
    }

    /**
     * @param speciessubstructure The species to analyze
     * @param structureCollection The ArrayList of substructures to find in speciessubstructure
     * @return The largest match from the array. If no match, result is null,
     * 
     * This routine sorts the array of JThermodynamicsAtomCountSet from largest to smallest.
     * In this order, each structure is tried. If there is a match, then that structure is returned.
     * 
     * The mapping is tried only if the substructure is 'strictlyLessThanOrEqual' (as defined by AtomCounts)
     * than that of speciessubstructure
     * 
     * GetSubstructureMatches is used to find the matches.
     * 
     * A match is defined when one of the maps returned from the GetSubstructureMatches call 
     * has the same number of elements as the number of atoms in the substructure
     * ( atommap.size() == substructure.getAtomCount() )
     * 
     * 
     */
    private static JThermodynamicsAtomCountSet findStructureMatch(JThermodynamicsAtomCountSet speciessubstructure,
            ArrayList<JThermodynamicsAtomCountSet> structureCollection) {
        Collections.sort(structureCollection);
        GetSubstructureMatches matches = new GetSubstructureMatches();
        JThermodynamicsAtomCountSet match = null;
        JThermodynamicsAtomCountSet denergycounts = null;
        boolean notfound = true;
        Iterator<JThermodynamicsAtomCountSet> iter = structureCollection.iterator();
        IAtomContainer radical = speciessubstructure.getSubstructure();
        while (iter.hasNext() && notfound) {
            denergycounts = iter.next();
            IAtomContainer substructure = denergycounts.getSubstructure();
            //if (speciessubstructure.strictlyLessThanOrEqual(denergycounts)) {
            if (true) {
                try {
                    List<List<RMap>> atommaps = matches.getAtomMatches(radical, substructure);
                    Iterator<List<RMap>> mapiter = atommaps.iterator();
                    while (mapiter.hasNext() && notfound) {
                        List<RMap> atommap = mapiter.next();
                        if (atommap.size() == substructure.getAtomCount()) {
                            notfound = false;
                        }
                    }
                } catch (CDKException e) {
                    System.out.println(e.getMessage());
                }
            }
            if (!notfound) {
                match = denergycounts;
            }
        }
        return match;
    }

    /**
     * Convert JThermodynamics2DSpeciesStructure to SubStructure class
     * 
     * @param substructure A JThermodynamics2DSpeciesStructure
     * @return The SubStructure class
     */
    private static ArrayList<JThermodynamicsAtomCountSet> convertToSetOfSubStructures(JsonArray substructures) {
        ArrayList<JThermodynamicsAtomCountSet> set = new ArrayList<JThermodynamicsAtomCountSet>();
        for (int i = 0; i < substructures.size(); i++) {
            JsonObject substructure = substructures.get(i).getAsJsonObject();
            JsonObject structure = substructure.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure)
                    .getAsJsonObject();
            JThermodynamicsAtomCountSet species;
            try {
                species = new JThermodynamicsAtomCountSet(structure);
                species.setJsonObjectSubstructure(substructure);
                set.add(species);
            } catch (CDKException e) {
                System.out.println("Error with   Name:"
                        + structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString());
                e.printStackTrace();
            }

        }
        return set;
    }
    
    public static JsonObject convertJThermodynamicsStructureToContribution(JsonObject structure, JsonObject info) {
        JsonObject thermo = structure.get(ClassLabelConstants.JThermodynamicStandardThermodynamics).getAsJsonObject();
        
        JsonObject enthalpyparameter = thermo.get(ClassLabelConstants.ThermodynamicStandardEnthalpy).getAsJsonObject().deepCopy();
        ParameterUtilities.changeParameterToNewSpecification(enthalpyparameter, info, ClassLabelConstants.ParameterSpecificationEnthalpy);
        JsonObject enthalpyspec = info.get(ClassLabelConstants.ParameterSpecificationEnthalpy).getAsJsonObject();
        enthalpyparameter.add(ClassLabelConstants.ParameterSpecification, enthalpyspec);
        
        JsonObject entropyparameter = thermo.get(ClassLabelConstants.ThermodynamicStandardEntropy).getAsJsonObject().deepCopy();
        ParameterUtilities.changeParameterToNewSpecification(entropyparameter, info, ClassLabelConstants.ParameterSpecificationEntropy);
        JsonObject entropyspec = info.get(ClassLabelConstants.ParameterSpecificationEntropy).getAsJsonObject();
        enthalpyparameter.add(ClassLabelConstants.ParameterSpecification, entropyspec);
        
        JsonArray heatcapacities = thermo.get(ClassLabelConstants.ThermodynamicCpAtTemperature).getAsJsonArray().deepCopy();
        
        JsonObject originalspec = thermo.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        JsonObject newspec = info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        for(int i=i=0;i<heatcapacities.size();i++) {
            JsonObject cpT = heatcapacities.get(i).getAsJsonObject();
            String cpS = cpT.get(ClassLabelConstants.ThermodynamicHeatCapacityValue).getAsString();
            String newcpS = ParameterUtilities.changeParameterToNewSpecification(cpS,originalspec,newspec);
            cpT.addProperty(ClassLabelConstants.ThermodynamicHeatCapacityValue,newcpS);
        }
        JsonObject contribution = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicContributions");
        contribution.add(ClassLabelConstants.ThermodynamicStandardEnthalpy, enthalpyparameter);
        contribution.add(ClassLabelConstants.ThermodynamicStandardEntropy, entropyparameter);
        contribution.add(ClassLabelConstants.ThermodynamicCpAtTemperature, heatcapacities);
        contribution.add(ClassLabelConstants.ParameterSpecificationHeatCapacity, newspec);
        return contribution;
    }

}
