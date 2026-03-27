package info.esblurock.background.services.dataset.parameters;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.units.DatabaseUnitUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class ParameterUtilities {
    private static String defaultenthalpyUnits = "unit:KiloCAL-PER-MOL";
    private static String defaultentropyUnits = "unit:CAL-PER-MOL-K";
    private static String defaultCpUnits = "unit:CAL-PER-MOL-K";
    
    private static int defaulttemps[]  = {
                               300,
                               400,
                               500,
                               600,
                               800,
                               1000,
                               1500
    };

    /**
     * Modify parameter value and uncertainty to new units
     * 
     * @param parameter          The ParameterValue object
     * @param info               The object holding the final specification
     * @param infospecidentifier
     */
    public static void changeParameterToNewSpecification(JsonObject parameter, JsonObject info,
            String infospecidentifier) {
        JsonObject origspec = parameter.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject();
        JsonObject finalspec = info.get(infospecidentifier).getAsJsonObject();
        changeParameterToNewSpecification(parameter, origspec, finalspec);
    }

    /**
     * Convert parameter value and uncertainty to new units
     * 
     * @param parameter The ParameterValue object
     * @param origspec  The ParameterSpecification of the original value
     * @param finalspec The ParameterSpecification of the final value
     */
    public static void changeParameterToNewSpecification(JsonObject parameter, JsonObject origspec,
            JsonObject finalspec) {
        String value = parameter.get(ClassLabelConstants.ValueAsString).getAsString();
        String error = parameter.get(ClassLabelConstants.ValueUncertainty).getAsString();
        
        String newvalue = changeParameterToNewSpecification(value,origspec,finalspec);
        String newerror = changeParameterToNewSpecification(error,origspec,finalspec);
        
        parameter.add(ClassLabelConstants.ParameterSpecification, finalspec);
        parameter.addProperty(ClassLabelConstants.ValueAsString, newvalue);
        parameter.addProperty(ClassLabelConstants.ValueUncertainty, newerror);
    }
    
    
    public static String changeParameterToNewSpecification(String origvalue, JsonObject origspec, JsonObject finalspec) {
        String value = null;
        Double valueD = Double.valueOf(origvalue);
        JsonObject origunit = origspec.get(ClassLabelConstants.ValueUnits).getAsJsonObject();
        String origunits = origunit.get(OntologyObjectLabels.quantitykind).getAsString();
        JsonObject finalunit = finalspec.get(ClassLabelConstants.ValueUnits).getAsJsonObject();
        String finalunits = finalunit.get(OntologyObjectLabels.quantitykind).getAsString();
        Double newvalue = DatabaseUnitUtilities.conversion(valueD, origunits, finalunits);
        if (newvalue != null) {
            value = newvalue.toString();
        }
        return value;
    }

    /**
     * Thermo Contribution with just entropy filled in.
     * 
     * @param entropy The entropy value
     * @param name    The name of the contribution
     * @param info    The input with the units of entropy
     * @return The ThermodynamicContributions with the entropy value (the enthalpy
     *         and Cps are zero)
     * 
     *         The default units for the entropy are used. If there is a enthalpy
     *         and/or Cp specifications in the information, then those units will be
     *         used, otherwise the default
     */
    public static JsonObject parameterWithEntropy(double entropy, String name, JsonObject info) {
        return parameterWithEntropy(defaultentropyUnits, entropy, name, info);
    }

    /**
     * Thermo Contribution with just entropy filled in.
     * 
     * @param origunits Entropy parameter specification of the entropy value
     * @param entropy     The entropy value
     * @param name        The name of the contribution
     * @param info        The input with the units of entropy
     * @return The ThermodynamicContributions with the entropy value (the enthalpy
     *         and Cps are zero)
     * 
     *         If there is a enthalpy and/or Cp specifications in the information,
     *         then those units will be used, otherwise the default
     * 
     */
    public static JsonObject parameterWithEntropy(String origunits, double entropy, String name, JsonObject info) {
        
        JsonObject contribution = emptyThermodynamicContributions(name,info);
        
        
        JsonObject entropyP = contribution.get(ClassLabelConstants.ThermodynamicStandardEntropy).getAsJsonObject();
        JsonObject entropyspec = entropyP.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject();
        JsonObject finalunit = entropyspec.get(ClassLabelConstants.ValueUnits).getAsJsonObject();
        String finalunits = finalunit.get(OntologyObjectLabels.quantitykind).getAsString();
        
        String value = Double.toString(entropy);
        Double newvalue = DatabaseUnitUtilities.conversion(entropy, origunits, finalunits);
        if (newvalue != null) {
            value = newvalue.toString();
        }
        
        entropyP.addProperty(ClassLabelConstants.ValueAsString, value);
        return contribution;

        /*
        
        JsonObject contribution = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicContributions");
        JsonObject enthalpyP = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationEnthaply) != null) {
            enthalpyP = info.get(ClassLabelConstants.ParameterSpecificationEnthaply).getAsJsonObject();
        }
        JsonObject entropyP = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationEntropy) != null) {
            enthalpyP = info.get(ClassLabelConstants.ParameterSpecificationEntropy).getAsJsonObject();
        }
        JsonObject heatcapacityP = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity) != null) {
            heatcapacityP = info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        }
        
        

        
        ParameterUtilities.changeParameterToNewSpecification(entropyP, info,
                ClassLabelConstants.ParameterSpecificationEntropy);

        String enthalpyvaluespec = defaultenthalpyUnits;
        
        if (info.get(ClassLabelConstants.ParameterSpecificationEnthaply) != null) {
            
            JsonObject unitspec = enthalpyP.get(ClassLabelConstants.ValueUnits).getAsJsonObject();
            enthalpyvaluespec = unitspec.get(ClassLabelConstants.UnitsOfValue).getAsString();
       } else {
           
       }

        enthalpyP.addProperty(ClassLabelConstants.ValueAsString, "0.0");
        enthalpyP.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");


        contribution.add(ClassLabelConstants.ThermodynamicStandardEnthalpy, enthalpyP);
        contribution.add(ClassLabelConstants.ThermodynamicStandardEntropy, entropyP);
        contribution.addProperty(ClassLabelConstants.DescriptionTitle, name);
        
        JsonArray arr = new JsonArray();
        contribution.add(ClassLabelConstants.ThermodynamicCpAtTemperature, arr);
        JsonObject cpparam = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity) != null) {
            cpparam = info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        } else {
            JsonObject cpparameter = DatabaseUnitUtilities.createEmptyParameter("dataset:ThermodynamicStandardEnthalpy",
                    defaultCpUnits, "dataset:ImpliedDigitsUncertainty");
            cpparam = cpparameter.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject();
        }

        contribution.add(ClassLabelConstants.ParameterSpecificationHeatCapacity, cpparam);

        return contribution;
        */
    }
    
    public static JsonObject emptyThermodynamicContributions(String name, JsonObject info) {
        JsonObject contribution = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicContributions");
        JsonObject enthalpySpec = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationEnthalpy) != null) {
            enthalpySpec = info.get(ClassLabelConstants.ParameterSpecificationEnthalpy).getAsJsonObject();
        }
        JsonObject entropySpec = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationEntropy) != null) {
            entropySpec = info.get(ClassLabelConstants.ParameterSpecificationEntropy).getAsJsonObject();
        }
        JsonObject heatcapacitySpec = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity) != null) {
            heatcapacitySpec = info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        }
        JsonObject enthalpyP = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicStandardEnthalpy");
        JsonObject entropyP = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicStandardEntropy");
        
        enthalpyP.addProperty(ClassLabelConstants.ValueAsString, "0.0");
        enthalpyP.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");
        entropyP.addProperty(ClassLabelConstants.ValueAsString, "0.0");
        entropyP.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");

        enthalpyP.add(ClassLabelConstants.ParameterSpecification,enthalpySpec);
        entropyP.add(ClassLabelConstants.ParameterSpecification,entropySpec);
        contribution.add(ClassLabelConstants.ParameterSpecificationHeatCapacity,enthalpySpec);
        
        contribution.add(ClassLabelConstants.ThermodynamicStandardEnthalpy, enthalpyP);
        contribution.add(ClassLabelConstants.ThermodynamicStandardEntropy, entropyP);
        contribution.addProperty(ClassLabelConstants.DescriptionTitle, name);
                
        JsonArray arr = new JsonArray();
        contribution.add(ClassLabelConstants.ThermodynamicCpAtTemperature, arr);
        JsonArray temps = new JsonArray();
        if(info.get(ClassLabelConstants.JThermodynamicBensonTemperatures) != null) {
            JsonObject templist = info.get(ClassLabelConstants.JThermodynamicBensonTemperatures).getAsJsonObject();
            temps = templist.get(ClassLabelConstants.ThermodynamicTemperature).getAsJsonArray();
        } else {
            for(int temp : defaulttemps) {
                temps.add(temp);
            }
        }
        for(int i=0; i< temps.size(); i++) {
            double temp = temps.get(i).getAsDouble();
            JsonObject cptemp = new JsonObject();
            cptemp.addProperty(ClassLabelConstants.ThermodynamicTemperature, temp);
            cptemp.addProperty(ClassLabelConstants.ThermodynamicHeatCapacityValue, 0.0);
            arr.add(cptemp);
        }
        return contribution;        
    }

    /**
     * Thermo Contribution with just enthalpy filled in.
     * 
     * @param enthalpy The enthalpy value
     * @param name     The name of the contribution
     * @param info     The input with the units of entropy
     * @return The ThermodynamicContributions with the enthalpy value (the entropy
     *         and Cps are zero)
     * 
     *         The units of the enthalpy are assumed to be default. If there is a
     *         entropy and/or specifications in the information, then those units
     *         will be used, otherwise the default
     * 
     */
    public static JsonObject parameterWithEnthalpy(double enthalpy, String name, JsonObject info) {
        return parameterWithEnthalpy(defaultenthalpyUnits, enthalpy, name, info);
    }

    /**
     * The Thermo contribution of with the enthalpy filled in
     * 
     * @param origunits The units of the enthalpy
     * @param enthalpy     The enthalpy value
     * @param name         The name of the contribution
     * @param info         The (activity) input with the units of entropy
     * @return The ThermodynamicContributions with the enthalpy value (the entropy
     *         and Cps are zero)
     * 
     *         If there is a entropy and/or specifications in the information, then
     *         those units will be used, otherwise the default
     */
    public static JsonObject parameterWithEnthalpy(String origunits, double enthalpy, String name, JsonObject info) {
        
        JsonObject contribution = emptyThermodynamicContributions(name,info);
        
        JsonObject enthalpyP = contribution.get(ClassLabelConstants.ThermodynamicStandardEnthalpy).getAsJsonObject();
        JsonObject enthalpyspec = enthalpyP.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject();
        JsonObject finalunit = enthalpyspec.get(ClassLabelConstants.ValueUnits).getAsJsonObject();
        String finalunits = finalunit.get(OntologyObjectLabels.quantitykind).getAsString();
        
        String value = Double.toString(enthalpy);
        Double newvalue = DatabaseUnitUtilities.conversion(enthalpy, origunits, finalunits);
        if (newvalue != null) {
            value = newvalue.toString();
        }
        
        enthalpyP.addProperty(ClassLabelConstants.ValueAsString, value);
        return contribution;
        /*
        
        String entropyvaluespec = defaultentropyUnits;
        if (info.get(ClassLabelConstants.ParameterSpecificationEnthaply) == null) {
            JsonObject entropyspec = info.get(ClassLabelConstants.ParameterSpecificationEnthaply).getAsJsonObject();
            entropyvaluespec = entropyspec.get(ClassLabelConstants.ValueUnits).getAsString();
        }
        JsonObject entropyP = DatabaseUnitUtilities.createEmptyParameter("dataset:ThermodynamicStandardEntropy",
                entropyvaluespec, "dataset:ImpliedDigitsUncertainty");
        entropyP.addProperty(ClassLabelConstants.ValueAsString, Double.toString(0.0));
        entropyP.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");

        JsonObject enthalpyP = DatabaseUnitUtilities.createEmptyParameter("dataset:ThermodynamicStandardEnthalpy",
                enthalpyspec, "dataset:ImpliedDigitsUncertainty");
        enthalpyP.addProperty(ClassLabelConstants.ValueAsString, Double.toString(enthalpy));
        enthalpyP.addProperty(ClassLabelConstants.ValueUncertainty, "0.0");
        ParameterUtilities.changeParameterToNewSpecification(enthalpyP, info,
                ClassLabelConstants.ParameterSpecificationEnthaply);


        JsonObject cpparam = null;
        if (info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity) != null) {
            cpparam = info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        } else {
            JsonObject cpparameter = DatabaseUnitUtilities.createEmptyParameter("dataset:ThermodynamicStandardEnthalpy",
                    defaultCpUnits, "dataset:ImpliedDigitsUncertainty");
            cpparam = cpparameter.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject();
        }
        contribution.add(ClassLabelConstants.ParameterSpecificationHeatCapacity, cpparam);

        return contribution;
        */
    }

}
