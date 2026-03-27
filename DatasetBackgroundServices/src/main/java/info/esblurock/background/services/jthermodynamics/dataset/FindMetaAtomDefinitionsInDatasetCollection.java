package info.esblurock.background.services.jthermodynamics.dataset;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.FindDatasetCollections;
import info.esblurock.background.services.dataset.molecule.DatasetMoleculeUtilities;
import info.esblurock.background.services.jthermodynamics.structure.GenerateJThermodynamics2DSpeciesStructure;
import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import thermo.data.structure.structure.MetaAtomDefinition;
import thermo.data.structure.structure.MetaAtomInfo;
import thermo.data.structure.structure.SetOfMetaAtomsForSubstitution;
import thermo.data.structure.structure.StructureAsCML;
import thermo.data.structure.structure.SubstituteBackMetaAtomsIntoMolecule;
import thermo.data.structure.structure.matching.SubstituteLinearStructures;

public class FindMetaAtomDefinitionsInDatasetCollection {

    public static JsonObject substituteAndCondenseLinearMolecule(JsonObject info) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("Substitute And Condense Linear Molecule");
        Element body = MessageConstructor.isolateBody(document);
        IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
        if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
            JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
            String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
            String metaatomtype = "LinearStructure";
            body.addElement("div").addText("Maintainer      : " + maintainer);
            body.addElement("div").addText("dataset         : " + dataset);
            body.addElement("div").addText("Meta Atom type  : " + metaatomtype);

            StructureAsCML cmlstruct = null;
            try {
                cmlstruct = new StructureAsCML(molecule);
                body.addElement("div").addText("Original Molecule");
                body.addElement("pre").addText(cmlstruct.getCmlStructureString());
                SetOfMetaAtomsForSubstitution substitution = setUpSubstituteMetaAtoms(maintainer, dataset,
                        metaatomtype);
                SubstituteLinearStructures linear = new SubstituteLinearStructures(substitution);
                IAtomContainer newmolecule = linear.substitute(cmlstruct);
                cmlstruct = new StructureAsCML(newmolecule);
                body.addElement("div").addText("Substituted Molecule");
                body.addElement("pre").addText(cmlstruct.getCmlStructureString());
                JsonObject molstructure = GenerateJThermodynamics2DSpeciesStructure.generate(newmolecule);
                response = StandardResponse.standardServiceResponse(document,
                        "Substitute of LinearStructure successful", molstructure);
            } catch (CDKException | IOException e) {
                e.printStackTrace();
                response = StandardResponse.standardErrorResponse(document,
                        "Error in substituting molecule: " + e.getMessage(), info);
            }
        } else {
            String errorS = "No Collection Set Record found";
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }

        return response;
    }

    public static JsonObject substituteMolecule(JsonObject info) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("Substitute Molecule");
        Element body = MessageConstructor.isolateBody(document);
        IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
        if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
            JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
            String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
            String metaatomtype = info.get(ClassLabelConstants.JThermodynamicsMetaAtomType).getAsString();
            body.addElement("div").addText("Maintainer      : " + maintainer);
            body.addElement("div").addText("dataset         : " + dataset);
            body.addElement("div").addText("Meta Atom type  : " + metaatomtype);
            StructureAsCML cmlstruct = null;
            try {
                cmlstruct = new StructureAsCML(molecule);
                body.addElement("div").addText("Original Molecule");
                body.addElement("pre").addText(cmlstruct.getCmlStructureString());
                SetOfMetaAtomsForSubstitution substitution = setUpSubstituteMetaAtoms(maintainer, dataset,
                        metaatomtype);
                IAtomContainer newmolecule = null;
                if (metaatomtype.equals("LinearStructure")) {
                    SubstituteLinearStructures linear = new SubstituteLinearStructures(substitution);
                    newmolecule = linear.substitute(cmlstruct);
                } else {
                    newmolecule = substitution.substitute(cmlstruct);
                }
                cmlstruct = new StructureAsCML(newmolecule);
                body.addElement("div").addText("Substituted Molecule");
                body.addElement("pre").addText(cmlstruct.getCmlStructureString());
                JsonObject molstructure = GenerateJThermodynamics2DSpeciesStructure.generate(newmolecule);
                response = StandardResponse.standardServiceResponse(document,
                        "Substitute of " + metaatomtype + " successful", molstructure);
            } catch (ClassNotFoundException | CDKException | IOException e) {
                e.printStackTrace();
                response = StandardResponse.standardErrorResponse(document,
                        "Error in substituting molecule: " + e.getMessage(), info);
            }
        } else {
            String errorS = "No Collection Set Record found";
            response = StandardResponse.standardErrorResponse(document, errorS, null);
        }

        return response;
    }

    public static SetOfMetaAtomsForSubstitution setUpSubstituteMetaAtoms(String maintainer, String dataset,
            String metaatomtype) {
        SetOfMetaAtomsForSubstitution substitute = new SetOfMetaAtomsForSubstitution();
        JsonArray arr = findMetaAtomDefinitions(maintainer, dataset, metaatomtype);
        ArrayList<MetaAtomDefinition> lst = findMetaAtomDefinitions(arr);
        if (lst != null) {
            Iterator<MetaAtomDefinition> iter = lst.iterator();
            while (iter.hasNext()) {
                MetaAtomDefinition def = iter.next();
                substitute.addDefinition(def);
            }
        } else {
            System.out.println("No meta atoms for '" + metaatomtype + "' Substitions found");
            //substitute = null;
        }
        return substitute;
    }

    public static JsonArray findMetaAtomDefinitions(String maintainer, String dataset, String metaatomtype) {
        JsonObject setofprops = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
        JsonArray arr = new JsonArray();
        setofprops.add(ClassLabelConstants.PropertyValueQueryPair, arr);
        JsonObject prop = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
        prop.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:jthermometaatominfo.dataset:metaatomtype");
        prop.addProperty(ClassLabelConstants.ShortStringKey, metaatomtype);
        arr.add(prop);
        return findMetaAtomDefinitions(maintainer, dataset, setofprops);
    }

    public static JsonArray findMetaAtomDefinitions(String maintainer, String dataset, JsonObject setofproperties) {
        String classname = "dataset:JThermodynamicsMetaAtomDefinitionDatabase";
        String service = "ReadInDatasetWithDatasetCollectionLabel";
        JsonObject json = new JsonObject();
        JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
        if (setofproperties != null) {
            json.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, setofproperties);
        }
        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
        json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
        json.addProperty(DatabaseServicesBase.service, service);
        JsonObject response = DatabaseServicesBase.process(json);
        JsonArray arr = null;
        if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
        } else {
            System.out.println("-------------------------------------------------------------");
            System.out.println("Reading of Meta atoms unsuccessful");
            System.out.println(JsonObjectUtilities.toString(recordid));
            System.out.println(JsonObjectUtilities.toString(json));
            System.out.println(JsonObjectUtilities.toString(response));
            arr = null;
            System.out.println("-------------------------------------------------------------");
        }
        return arr;

    }

    public static ArrayList<MetaAtomDefinition> findMetaAtomDefinitions(JsonArray arr) {
        ArrayList<MetaAtomDefinition> deflist = new ArrayList<MetaAtomDefinition>();
        if (arr != null) {
            for (int i = 0; i < arr.size(); i++) {
                JsonObject metaatomcatalog = arr.get(i).getAsJsonObject();
                if (metaatomcatalog.get(ClassLabelConstants.JThermodynamicsMetaAtomInfo) != null) {
                    JsonObject metaatom = metaatomcatalog.get(ClassLabelConstants.JThermodynamicsMetaAtomInfo)
                            .getAsJsonObject();
                    MetaAtomDefinition definition = convertToMetaAtomDefinition(metaatom);
                    if (definition != null) {
                        deflist.add(definition);
                    }
                } else {
                    System.out.println("Meta Atom info not defined in Catalog Object");
                }
            }
        } else {
            System.out.println("No Meta atoms defined in collection");
            deflist = null;
        }
        return deflist;
    }

    public static MetaAtomDefinition convertToMetaAtomDefinition(JsonObject metaatom) {
        MetaAtomDefinition definition = null;
        if (metaatom.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure) != null) {
            JsonObject structure = metaatom.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure)
                    .getAsJsonObject();
            String cml = structure.get(ClassLabelConstants.JThermodynamicsStructureAsCMLString).getAsString();
            String name = structure.get(ClassLabelConstants.JThermodynamicsStructureName).getAsString();
            StructureAsCML structascml = new StructureAsCML(name, cml);
            String label = metaatom.get(ClassLabelConstants.JThermodynamicsMetaAtomLabel).getAsString();
            String type = metaatom.get(ClassLabelConstants.JThermodynamicsMetaAtomType).getAsString();
            MetaAtomInfo info = new MetaAtomInfo();
            info.setMetaAtomType(type);
            info.setMetaAtomName(label);
            info.setElementName(name);
            try {
                definition = new MetaAtomDefinition(info, structascml);
            } catch (ClassNotFoundException | CDKException | IOException e) {
                e.printStackTrace();
            }
        } else {
            System.out.println("Meta Atom info not defined in Catalog Object");
        }
        return definition;
    }
}
