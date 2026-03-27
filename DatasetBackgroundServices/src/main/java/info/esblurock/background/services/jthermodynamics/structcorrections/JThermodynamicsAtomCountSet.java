package info.esblurock.background.services.jthermodynamics.structcorrections;

import java.util.HashSet;

import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import thermo.data.structure.structure.AtomCounts;
import thermo.data.structure.structure.StructureAsCML;
public class JThermodynamicsAtomCountSet extends AtomCounts {
    private static final long serialVersionUID = 1L;
    
    String oxygenCountS;
    String hydrogenCountS;
    String carbonCountS;
    
    IAtomContainer molecule;
    public String moleculename;
    JsonObject subStructure;
    
    

    public JThermodynamicsAtomCountSet(JsonObject structure) throws CDKException {
        subStructure = structure;
        String cmlS = structure.get(ClassLabelConstants.JThermodynamicsStructureAsCMLString).getAsString();
        moleculename = structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
        StructureAsCML cml = new StructureAsCML(moleculename,cmlS);
        molecule = cml.getMolecule();
        JsonObject atmcnts = structure.get(ClassLabelConstants.JThermodynamicsAtomCountSet).getAsJsonObject();
        JsonArray arr = atmcnts.get(ClassLabelConstants.JThermodynamicsAtomCount).getAsJsonArray();
        HashSet<String> atomnames = getAtomNames();
        for(int i=0; i<arr.size(); i++) {
            JsonObject atomcountJ = arr.get(i).getAsJsonObject();
            int count = atomcountJ.get(ClassLabelConstants.AtomTypeCount).getAsInt();
            Integer countI = Integer.valueOf(count);
            String atomname = atomcountJ.get(ClassLabelConstants.JThermodynamics2DSpeciesLabel).getAsString();
            this.put(atomname, countI);
            atomnames.add(atomname);
        }
        this.setMoleculeID(moleculename);
        if(this.get("O") != null) {
            oxygenCountS = Integer.toString(this.get("O"));
        } else {
            oxygenCountS = "0";
        }
        if(this.get("H") != null) {
            hydrogenCountS = Integer.toString(this.get("H"));
        } else {
            oxygenCountS = "0";
        }
        if(this.get("C") != null) {
            carbonCountS = Integer.toString(this.get("C"));
        } else {
            carbonCountS = "0";
        }
        
        
        
    }
    
    public void setJsonObjectSubstructure(JsonObject substructure) {
        subStructure = substructure;
    }
    
    public JsonObject getJsonObjectSubstructure() {
        return subStructure;
    }
    
    public IAtomContainer getSubstructure() {
        return molecule;
    }
    
}
