package info.esblurock.background.services.dataset.examine;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.parameters.ParameterUtilities;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public enum DataObjectSummary {
    
    JThermodynamics2DMoleculeThermodynamics {

        @Override
        public JsonArray objectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Structure Name");
            arr.add("Standard Enthalpy");
            arr.add("Standard Entropy");
            arr.add("Heat Capacity (300K)");
            return arr;
        }

        @Override
        public JsonArray objectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String name = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            arr.add(name);
            addThermoSummary(obj,info,arr);
            return arr;
        }

        @Override
        public JsonArray searchObjectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Isomer");
            return arr;
        }

        @Override
        public JsonArray searchObjectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String name = struct.get(ClassLabelConstants.JThermodynamicsStructureIsomerName).getAsString();
            arr.add(name);
            return arr;
        }
        
    }, JThermodynamics2DSubstructureThermodynamics {

        @Override
        public JsonArray objectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Structure Name");
            arr.add("Structure Type");
            arr.add("Standard Enthalpy");
            arr.add("Standard Entropy");
            arr.add("Heat Capacity (300K)");
            return arr;
        }

        @Override
        public JsonArray objectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String name = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            arr.add(name);
            String type = obj.get(ClassLabelConstants.JThermodynamicsSubstructureType).getAsString();
            arr.add(type);
            addThermoSummary(obj,info,arr);
            return arr;
        }

        @Override
        public JsonArray searchObjectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Type");
            arr.add("Isomer");
            return arr;
        }

        @Override
        public JsonArray searchObjectValues(JsonObject obj, JsonObject infoj) {
            JsonArray arr = new JsonArray();
            String type = obj.get(ClassLabelConstants.JThermodynamicsSubstructureType).getAsString();
            arr.add(type);
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String name = struct.get(ClassLabelConstants.JThermodynamicsStructureIsomerName).getAsString();
            arr.add(name);
            return arr;
        }
        
    }, ThermodynamicBensonRuleDefinition {

        @Override
        public JsonArray objectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Benson Rule");
            arr.add("Standard Enthalpy");
            arr.add("Standard Entropy");
            arr.add("Heat Capacity (300K)");
            return arr;
        }

        @Override
        public JsonArray objectValues(JsonObject obj, JsonObject info) {
            JsonObject benstruct = obj.get(ClassLabelConstants.JThermodynamicsBensonRuleStructure).getAsJsonObject();
            String name = benstruct.get(ClassLabelConstants.BensonRuleDatabaseReference).getAsString();
            
            JsonArray arr = new JsonArray();
            arr.add(name);
            this.addThermoSummary(obj,info,arr);
            return arr;
        }

        @Override
        public JsonArray searchObjectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Center Atom");
            return arr;
        }

        @Override
        public JsonArray searchObjectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject benstruct = obj.get(ClassLabelConstants.JThermodynamicsBensonRuleStructure).getAsJsonObject();
            String centername = benstruct.get(ClassLabelConstants.JThermodynamicsBensonCenterAtom).getAsString();
            arr.add(centername);
            return arr;
        }
        
    }, JThermodynamicsDisassociationEnergyOfStructure {

        @Override
        public JsonArray objectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Structure Name");
            arr.add("Energy");
            
            return arr;
        }

        @Override
        public JsonArray objectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String name = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            arr.add(name);

            JsonObject parameter = obj.get(ClassLabelConstants.JThermodynamicDisassociationEnergy).getAsJsonObject();
            JsonObject disassociationspec = info.get(ClassLabelConstants.ParameterSpecificationEnthalpy).getAsJsonObject();
            String value = ParameterUtilities.changeParameterToNewSpecification(parameter.get(ClassLabelConstants.ValueAsString).getAsString(),
                    parameter.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject(), disassociationspec);
            arr.add(value);
            return arr;
        }

        @Override
        public JsonArray searchObjectNames() {
            JsonArray arr = new JsonArray();
            return arr;
        }

        @Override
        public JsonArray searchObjectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            return arr;
        }
        
    }, JThermodynamicsMetaAtomDefinition {

        @Override
        public JsonArray objectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Meta Atom Name");
            arr.add("Label");
            arr.add("Type");
            arr.add("Specification");
            return arr;
        }

        @Override
        public JsonArray objectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamicsMetaAtomInfo).getAsJsonObject();
            String name = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            arr.add(name);
            String label = struct.get(ClassLabelConstants.JThermodynamicsMetaAtomLabel).getAsString();
            arr.add(label);
            String type = struct.get(ClassLabelConstants.JThermodynamicsMetaAtomType).getAsString();
            arr.add(type);
            String structurespec = obj.get(ClassLabelConstants.JThermodynamicsStructureSpecification).getAsString();
            arr.add(structurespec);
            return arr;
       }

        @Override
        public JsonArray searchObjectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Type");
            return arr;
        }

        @Override
        public JsonArray searchObjectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamicsMetaAtomInfo).getAsJsonObject();
            String type = struct.get(ClassLabelConstants.JThermodynamicsMetaAtomType).getAsString();
            arr.add(type);
            return arr;
        }
        
    }, JThermodynamicsSymmetryStructureDefinition {

        @Override
        public JsonArray objectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Label");
            arr.add("Type");
            arr.add("Factor");
            arr.add("Structure");
            return arr;
        }

        @Override
        public JsonArray objectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject def = obj.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
            String label = def.get(ClassLabelConstants.JThermodynamicSymmetryDefinitionLabel).getAsString();
            arr.add(label);
            String type = def.get(ClassLabelConstants.StructureSymmetryType).getAsString();
            arr.add(type);
            String factor = def.get(ClassLabelConstants.SymmetryFactorOfStructure).getAsString();
            arr.add(factor);
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String structname = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            arr.add(structname);
            return arr;
        }

        @Override
        public JsonArray searchObjectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Type");
            return arr;
        }

        @Override
        public JsonArray searchObjectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject def = obj.get(ClassLabelConstants.JThermodynamicsSymmetryDefinition).getAsJsonObject();
            String type = def.get(ClassLabelConstants.StructureSymmetryType).getAsString();
            arr.add(type);
            return arr;
        }
        
    }, JThermodynamicsVibrationalStructure {

        @Override
        public JsonArray objectNames() {
            JsonArray arr = new JsonArray();
            arr.add("Label");
            arr.add("Symmetry");
            arr.add("Structure");
            return arr;
       }

        @Override
        public JsonArray objectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            String label = obj.get(ClassLabelConstants.JThermodynamicsVibrationalModeLabel).getAsString();
            arr.add(label);
            String symmetry = obj.get(ClassLabelConstants.StructureVibrationalFrequencySymmetry).getAsString();
            arr.add(symmetry);
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String structname = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            arr.add(structname);            
            return arr;
        }

        @Override
        public JsonArray searchObjectNames() {
            JsonArray arr = new JsonArray();
            return arr;
        }

        @Override
        public JsonArray searchObjectValues(JsonObject obj, JsonObject info) {
            JsonArray arr = new JsonArray();
            JsonObject struct = obj.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
            String isomer = struct.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            arr.add(isomer);            
            return arr;
       }
        
    };
    
    public abstract JsonArray objectNames();
    public abstract JsonArray objectValues(JsonObject obj, JsonObject info);
    public abstract JsonArray searchObjectNames();
    public abstract JsonArray searchObjectValues(JsonObject obj, JsonObject info);
    
    
    /**
     * @param classname The name of the class of object to summarize
     * @param obj The object
     * @param info information from the activity
     * @return descriptors 
     */
    public static JsonObject createDescriptorSummary(String classname, JsonObject obj, JsonObject info) {
        DataObjectSummary create = DataObjectSummary.valueOf(classname.substring(8));
        JsonArray descriptors = create.objectValues(obj,info);
        JsonArray keys = create.objectNames();
        JsonObject values = new JsonObject();
        for(int i=0; i< keys.size(); i++) {
            String key = (String) keys.get(i).getAsString();
            String descriptor = (String) descriptors.get(i).getAsString();
            values.addProperty(key,descriptor);
        }
        createSearchSummary(values,classname,obj,info);
        
         return values;
    }
    
    /**
     * @param classname The name of the class of object to summarize
     * @param obj The object
     * @param info information from the activity
     * @return search terms
     */
    public static void createSearchSummary(JsonObject values, String classname, JsonObject obj, JsonObject info) {
        DataObjectSummary create = DataObjectSummary.valueOf(classname.substring(8));
        JsonArray descriptors = create.searchObjectValues(obj,info);
        JsonArray keys = create.searchObjectNames();
        
        for(int i=0; i< keys.size(); i++) {
            String key = (String) keys.get(i).getAsString();
            String descriptor = (String) descriptors.get(i).getAsString();
            values.addProperty(key,descriptor);
        }
    }
    
    protected void addThermoSummary(JsonObject obj, JsonObject info, JsonArray arr) {
        JsonObject thermo = obj.get(ClassLabelConstants.JThermodynamicStandardThermodynamics).getAsJsonObject();
         JsonObject enthalpy = thermo.get(ClassLabelConstants.ThermodynamicStandardEnthalpy).getAsJsonObject();
        JsonObject entropy = thermo.get(ClassLabelConstants.ThermodynamicStandardEntropy).getAsJsonObject();
        JsonObject heatcapspec = thermo.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject();
        JsonArray heatcaps = thermo.get(ClassLabelConstants.ThermodynamicCpAtTemperature).getAsJsonArray();
        String heatcap300 = find300HeatCapacity(heatcaps);
        String enthalpyS = ParameterUtilities.changeParameterToNewSpecification(enthalpy.get(ClassLabelConstants.ValueAsString).getAsString(), 
                enthalpy.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject(), 
                info.get(ClassLabelConstants.ParameterSpecificationEnthalpy).getAsJsonObject());
        arr.add(enthalpyS);

        String entropyS = ParameterUtilities.changeParameterToNewSpecification(entropy.get(ClassLabelConstants.ValueAsString).getAsString(), 
                entropy.get(ClassLabelConstants.ParameterSpecification).getAsJsonObject(), 
                info.get(ClassLabelConstants.ParameterSpecificationEntropy).getAsJsonObject());
        arr.add(entropyS);

        String heatcap300S = ParameterUtilities.changeParameterToNewSpecification(heatcap300, 
                heatcapspec, 
                info.get(ClassLabelConstants.ParameterSpecificationHeatCapacity).getAsJsonObject());
        arr.add(heatcap300S); 
    }
    protected String find300HeatCapacity(JsonArray heatcaps) {
        double diff = 100000000.0;
        String value = "0.0";
        for(JsonElement ele: heatcaps) {
            JsonObject heatcap = (JsonObject) ele;
            String temp = heatcap.get(ClassLabelConstants.ThermodynamicTemperature).getAsString();
            double tempD = Double.valueOf(temp);
            double difference = Math.abs(tempD - 300.0);
            if(difference < diff) {
                value = heatcap.get(ClassLabelConstants.ThermodynamicHeatCapacityValue).getAsString();
            }
        }
        return value;
    }
    

}
