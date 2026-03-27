package info.esblurock.background.services.servicecollection;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openscience.cdk.interfaces.IAtomContainer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.molecule.DatasetMoleculeUtilities;
import info.esblurock.background.services.jthermodynamics.CalculateThermodynamicsFromVibration;
import info.esblurock.background.services.jthermodynamics.ComputeTotalThermodynamics;
import info.esblurock.background.services.jthermodynamics.bensonrules.ComputeBensonRulesForMolecule;
import info.esblurock.background.services.jthermodynamics.dataset.FindMetaAtomDefinitionsInDatasetCollection;
import info.esblurock.background.services.jthermodynamics.disassociation.CalculateThermodynamicsForDisassociationEnergy;
import info.esblurock.background.services.jthermodynamics.structcorrections.CalculateStructureCorrection;
import info.esblurock.background.services.jthermodynamics.symmetry.ComputeThermodynamicsSymmetryContribution;
import info.esblurock.background.services.jthermodynamics.symmetry.DatabaseCalculateSymmetryCorrection;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public enum ServiceCollectionComputeThermodynamics {

    ComputeThermodynamicsFromBensonRules {

        @Override
        public JsonObject process(JsonObject activity) {
            Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromBensonRules");
            JsonObject response = null;
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
            if (molecule != null) {
                if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
                    JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
                    String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
                    String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
                    response = ComputeBensonRulesForMolecule.compute(maintainer, dataset, molecule, info);
                } else {
                    String errorS = "No Collection Set Record found";
                    response = StandardResponse.standardErrorResponse(document, errorS, null);
                }
            } else {
                String errorS = "Error in interpreting molecule";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
            return response;
        }

    },
    ComputeThermodynamicsFromExternalSymmetry {

        @Override
        public JsonObject process(JsonObject activity) {
            Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromExternalSymmetry");
            JsonObject response = null;
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
            if (molecule != null) {
                if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
                    JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
                    String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
                    String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
                    response = ComputeThermodynamicsSymmetryContribution.computeExternalSymmetry(maintainer, dataset,
                            molecule, info);
                } else {
                    String errorS = "No Collection Set Record found";
                    response = StandardResponse.standardErrorResponse(document, errorS, null);
                }
            } else {
                String errorS = "Error in interpreting molecule ";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
            return response;
        }

    },
    ComputeThermodynamicsFromSymmetryElement {

        @Override
        public JsonObject process(JsonObject activity) {
            Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromBensonRules");
            JsonObject response = null;
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
            if (molecule != null) {
                if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
                    JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
                    String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
                    String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
                    response = ComputeThermodynamicsSymmetryContribution.computeFromSymmetryObject(maintainer, dataset,
                            molecule, info);
                } else {
                    String errorS = "No Collection Set Record found";
                    response = StandardResponse.standardErrorResponse(document, errorS, null);
                }
            } else {
                String errorS = "Error in interpreting molecule ";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
            return response;
        }

    },
    ComputeThermodynamicsFromInternalSymmetry {

        @Override
        public JsonObject process(JsonObject activity) {
            Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromInternalSymmetry");
            JsonObject response = null;
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
            if (molecule != null) {
                if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
                    JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
                    String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
                    String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
                    response = ComputeThermodynamicsSymmetryContribution.computeInternalSymmetry(maintainer, dataset,
                            molecule, info);
                } else {
                    String errorS = "No Collection Set Record found";
                    response = StandardResponse.standardErrorResponse(document, errorS, null);
                }
            } else {
                String errorS = "Error in interpreting molecule ";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
            return response;
        }

    },
    ComputeThermodynamicsFromOpticalIsomers {

        @Override
        public JsonObject process(JsonObject activity) {
            Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromOpticalIsomers");
            JsonObject response = null;
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
            if (molecule != null) {
                if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
                    JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
                    String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
                    String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
                    response = ComputeThermodynamicsSymmetryContribution.computeOpticalSymmetry(maintainer, dataset,
                            molecule, info);
                } else {
                    String errorS = "No Collection Set Record found";
                    response = StandardResponse.standardErrorResponse(document, errorS, null);
                }
            } else {
                String errorS = "Error in interpreting molecule ";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
            return response;
        }

    },
    ComputeThermodynamicsFromAllSymmetries {

        @Override
        public JsonObject process(JsonObject activity) {
            Document document = MessageConstructor.startDocument("ComputeThermodynamicsFromAllSymmetries");
            Element body = MessageConstructor.isolateBody(document);
            JsonObject response = null;
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            IAtomContainer molecule = DatasetMoleculeUtilities.convertLinearFormToMolecule(info);
            if (molecule != null) {
                if (info.get(ClassLabelConstants.DatabaseCollectionRecordID) != null) {
                    JsonObject colrecordid = info.get(ClassLabelConstants.DatabaseCollectionRecordID).getAsJsonObject();
                    String maintainer = colrecordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
                    String dataset = colrecordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
                    body.addElement("div").addText("Maintainer      : " + maintainer);
                    body.addElement("div").addText("dataset         : " + dataset);
                    DatabaseCalculateSymmetryCorrection symmcorrection = new DatabaseCalculateSymmetryCorrection(
                            maintainer, dataset);
                    JsonArray total = symmcorrection.compute(document, molecule, body, info);
                    response = StandardResponse.standardServiceResponse(document,
                            "ComputeThermodynamicsFromAllSymmetries computed: " + total.size(), total);
                } else {
                    String errorS = "No Collection Set Record found";
                    response = StandardResponse.standardErrorResponse(document, errorS, null);
                }
            } else {
                String errorS = "Error in interpreting molecule";
                response = StandardResponse.standardErrorResponse(document, errorS, null);
            }
            return response;
        }

    },
    ComputeThermodynamicsFromVibrationalModes {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            return CalculateThermodynamicsFromVibration.computeVibrationalCorrectionsForRadical(info);
        }

    },
    ComputeThermodynamicsForDisassociationEnergy {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            return CalculateThermodynamicsForDisassociationEnergy.calculate(info);
        }

    },
    CalculateTherGasThermodynamics {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            return ComputeTotalThermodynamics.calculateTherGasThermodynamics(info);
        }
        
    },
    CalculateThermThermodynamics {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            return ComputeTotalThermodynamics.calculateTHERMThermodynamics(info);
        }
        
    },
    ComputeThermodynamicsFromHBIStructures {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            info.addProperty(ClassLabelConstants.JThermodynamicsSubstructureType, "dataset:HBISubstructure");
            return CalculateStructureCorrection.calculate(info);
        }
        
    },
    ComputeThermodynamicsFromRingStrain {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            info.addProperty(ClassLabelConstants.JThermodynamicsSubstructureType, "dataset:RingStrainCorrectionSubstructure");
            return CalculateStructureCorrection.calculate(info);
        }
        
    },
    ComputeThermodynamicsFromStericStructures {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            info.addProperty(ClassLabelConstants.JThermodynamicsSubstructureType, "dataset:StericCorrectionSubstructure");
            return CalculateStructureCorrection.calculate(info);
        }
        
    },
    SubstituteMetaAtomsInMolecule {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            return FindMetaAtomDefinitionsInDatasetCollection.substituteMolecule(info);
        }

    },
    SubstituteAndCondenseLinearMolecule {

        @Override
        public JsonObject process(JsonObject activity) {
            JsonObject info = activity.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
            return FindMetaAtomDefinitionsInDatasetCollection.substituteAndCondenseLinearMolecule(info);
        }

    };

    public abstract JsonObject process(JsonObject json);

}
