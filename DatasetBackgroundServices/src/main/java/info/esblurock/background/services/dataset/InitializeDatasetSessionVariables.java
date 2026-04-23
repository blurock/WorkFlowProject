package info.esblurock.background.services.dataset;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;

import java.util.Map;

import org.dom4j.Document;
import org.dom4j.Element;

import info.esblurock.background.services.firestore.session.SessionDataManagement;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.transaction.GenerateOrderedListOfPrerequisites;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class InitializeDatasetSessionVariables {

	private static JsonObject unitinfo = null;

	public static String formatinfoString = """
			{
			 		'dataset:JThermodynamicsVibrationalModes': {
			            'dataset:specificationLabel': 'Vibrational Modes',
						'dataset:filesourceformat': 'dataset:JThermodynamicsVibrationalModes',
						'dataset:partitionMethod': 'dataset:PartitionToLineSet',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsVibrationalStructure',
						'dataset:blocklinecount': '1',
						'dcat:catalog': 'dataset:JThermodynamicsVibrationalStructure',
						'prov:activity': 'dataset:ActivityInformationInterpretVibrationalMode',
			            'dataset:collectionobjecttype': 'dataset:JThermodynamicsVibrationalStructureDatabase',
						'dataset:datasetobjecttype': 'dataset:JThermodynamicsVibrationalStructureDataSet',
						'dataset:transactionid': 'dataset:TransactionInterpretVibrationalMode',
						'dataset:filesourcesubtype': 'dataset:FileMediaText',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
						'qudt:hasUnitSystem': ['dataset:paramspecfrequency'],
						'dataset:speciespectype'= 'dataset:SpeciesSpecificationNancyLinearForm'
							}


					},
					'dataset:TherGasBensonRules': {
			            'dataset:specificationLabel': 'Benson Rules',
						'dataset:filesourceformat': 'dataset:TherGasBensonRules',
						'dataset:partitionMethod': 'dataset:PartitionTherGasThermodynamics',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsBensonRules',
						'dataset:blocklinecount': '',
						'dcat:catalog': 'dataset:ThermodynamicBensonRuleDefinition',
						'prov:activity': 'dataset:ActivityInformationInterpretBensonRuleData',
					    'dataset:collectionobjecttype': 'dataset:ThermodynamicBensonRuleDefinitionDatabase',
						'dataset:datasetobjecttype': 'dataset:ThermodynamicBensonRuleDefinitionDataSet',
						'dataset:transactionid': 'dataset:TransactionInterpretBensonRule',
						'dataset:filesourcesubtype': 'dataset:FileMediaText',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
			    		'qudt:hasUnitSystem': ['dataset:paramspecenthalpy',
						                       'dataset:thermotemperature',
											   'dataset:paramspecentropy',
											   'dataset:paramspecheatcapacity']
									}
					},
					'dataset:ThergasSpeciesThermodynamics': {
			            'dataset:specificationLabel': 'Species Thermodynamics',
						'dataset:filesourceformat': 'dataset:ThergasSpeciesThermodynamics',
						'dataset:partitionMethod': 'dataset:PartitionTherGasThermodynamics',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsMolecule',
						'dataset:blocklinecount': '',
						'dcat:catalog': 'dataset:JThermodynamics2DMoleculeThermodynamics',
						'prov:activity': 'dataset:ActivityInformationMolecularThermodynamics',
			            'dataset:collectionobjecttype': 'dataset:JThermodynamics2DMoleculeThermodynamicsDatabase',
						'dataset:datasetobjecttype': 'dataset:JThermodynamics2DMoleculeThermodynamicsDataSet',
						'dataset:transactionid': 'dataset:TransactionInterpretMolecularThermodynamics',
						'dataset:filesourcesubtype': 'dataset:FileMediaText',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
						'qudt:hasUnitSystem': ['dataset:paramspecenthalpy',
						                       'dataset:thermotemperature',
											   'dataset:paramspecentropy',
											   'dataset:paramspecheatcapacity']
							}
					},
					'dataset:TherGasSubstructureThermodynamics': {
			            'dataset:specificationLabel': 'Substructure Thermodynamics',
						'dataset:filesourceformat': 'dataset:TherGasSubstructureThermodynamics',
						'dataset:partitionMethod': 'dataset:PartitionTherGasThermodynamics',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsSubstructures',
						'dataset:blocklinecount': '',
						'dataset:collectionobjecttype': 'dataset:JThermodynamics2DSubstructureThermodynamicsDatabase',
						'dataset:datasetobjecttype': 'dataset:JThermodynamics2DSubstructureThermodynamicsDataSet',
						'dcat:catalog': 'dataset:JThermodynamics2DSubstructureThermodynamics',
						'prov:activity': 'dataset:ActivityInformationInterpretSubstructureThermodynamics',
			            'dataset:collectionobjecttype': 'dataset:JThermodynamics2DSubstructureThermodynamics',
						'dcat:dataset':'dataset:JThermodynamics2DSubstructureThermodynamics',
						'dataset:transactionid': 'dataset:TransactionInterpretSubstructureThermodynamics',
						'dataset:filesourcesubtype': 'dataset:FileMediaText',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
						'qudt:hasUnitSystem': ['dataset:paramspecenthalpy',
						                       'dataset:thermotemperature',
											   'dataset:paramspecentropy',
											   'dataset:paramspecheatcapacity']
			}
					},
					'dataset:TherGasMoleculeThermodynamics': {
			            'dataset:specificationLabel': 'Molecule Thermodynamics',
						'dataset:filesourceformat': 'dataset:TherGasMoleculeThermodynamics',
						'dataset:partitionMethod': 'dataset:PartitionTherGasThermodynamics',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsMolecule',
						'dataset:blocklinecount': '',
						'dcat:catalog': 'dataset:JThermodynamics2DMoleculeThermodynamics',
						'prov:activity': 'dataset:ActivityInformationMolecularThermodynamics',
			            'dataset:collectionobjecttype': 'dataset:JThermodynamics2DMoleculeThermodynamicsDatabase',
						'dataset:datasetobjecttype': 'dataset:JThermodynamics2DMoleculeThermodynamicsDataSet',
						'dcat:dataset':'dataset:JThermodynamics2DMoleculeThermodynamicsDataset',
						'dataset:transactionid': 'dataset:TransactionInterpretMolecularThermodynamics',
						'dataset:filesourcesubtype': 'dataset:FileMediaText',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
						'qudt:hasUnitSystem': ['dataset:paramspecenthalpy',
						                       'dataset:thermotemperature',
											   'dataset:paramspecentropy',
											   'dataset:paramspecheatcapacity']
			}
					},
					'dataset:JThermodynamicsDisassociationEnergyFormat': {
			            'dataset:specificationLabel': 'Disassociation Energy',
						'dataset:filesourceformat': 'dataset:JThermodynamicsDisassociationEnergyFormat',
						'dataset:partitionMethod': 'dataset:PartitionToLineSet',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsDisassociationEnergy',
						'dataset:blocklinecount': '2',
						'dcat:catalog': 'dataset:JThermodynamicsDisassociationEnergyOfStructure',
						'prov:activity': 'dataset:ActivityInformationInterpretDisassociationEnergy',
			            'dataset:collectionobjecttype': 'dataset:JThermodynamicsDisassociationEnergyOfStructureDatabase',
						'dataset:datasetobjecttype': 'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet',
						'dcat:dataset':'dataset:JThermodynamicsDisassociationEnergyOfStructureDataset',
						'dataset:transactionid': 'dataset:TransactionInterpretDisassociationEnergy',
						'dataset:filesourcesubtype': 'dataset:FileMediaText',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
						'qudt:hasUnitSystem': ['dataset:hdisassociationparameter'],
						'dataset:speciespectype'= 'dataset:SpeciesSpecificationNancyLinearForm'
			}
					},
					'dataset:JThermodynamicsMetaAtomFormat': {
			            'dataset:specificationLabel': 'Meta Atom',
						'dataset:filesourceformat': 'dataset:JThermodynamicsMetaAtomFormat',
						'dataset:partitionMethod': 'dataset:PartitionToLineSet',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsMetaAtoms',
						'dataset:blocklinecount': '1',
						'dcat:catalog': 'dataset:JThermodynamicsMetaAtomDefinition',
						'prov:activity': 'dataset:ActivityInformationInterpretMetaAtom',
			            'dataset:collectionobjecttype': 'dataset:JThermodynamicsMetaAtomDefinitionDatabase',
						'dataset:datasetobjecttype': 'dataset:JThermodynamicsMetaAtomDefinitionDatSset',
						'dcat:dataset':'dataset:JThermodynamicsMetaAtomDefinitionDataset',
						'dataset:transactionid': 'dataset:TransactionInterpretMetaAtom',
						'dataset:filesourcesubtype': 'dataset:FileMediaText',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
						'qudt:hasUnitSystem': [],
						'dataset:speciespectype'= 'dataset:SpeciesSpecificationNancyLinearForm'
			}
					},
					'dataset:JThermodynamicsSymmetryDefinitionFormat': {
			            'dataset:specificationLabel': 'Symmetry Definition',
						'dataset:filesourceformat': 'dataset:symmetrystructuredefinition',
						'dataset:partitionMethod': 'dataset:PartitionXMLListOfCatalogObjects',
						'dataset:interpretMethod': 'dataset:ParseLinesJThermodynamicsSymmetryDefinition',
						'dataset:blocklinecount': '',
						'dcat:catalog': 'dataset:JThermodynamicsSymmetryStructureDefinition',
						'prov:activity': 'dataset:ActivityInformationInterpretSymmetryInformation',
			            'dataset:collectionobjecttype': 'dataset:JThermodynamicsSymmetryStructureDefinitionDatabase',
						'dataset:datasetobjecttype': 'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet',
						'dcat:dataset':'dataset:JThermodynamicsSymmetryStructureDefinitionDataset',
						'dataset:transactionid': 'dataset:TransactionInterpretSymmetryInformation',
						'dataset:filesourcesubtype': 'dataset:FileMediaTextXML',
						'dataset:filemediatype': 'dataset:FileMediaText',
						'dataset:supplementaryparameters': {
						'qudt:hasUnitSystem': []
						}
					}
			    }
			    """;

	public static String UnitParametersString = """
			{
				"dataset:paramspecenthalpy": {
					"qudt:Unit": {
						"qudt:SystemOfQuantities": "quantitykind:MolarEnergy",
						"qudt:QuantityKind": "unit:KiloCAL-PER-MOL"
					},
					"dataset:dynamicType": "dataset:FixedParameter",
					"skos:prefLabel": "Enthaply",
					"dataset:uncertainty": "dataset:ImpliedDigitsUncertainty"
				},
				"dataset:thermotemperature": {
					"qudt:Unit": {
						"qudt:SystemOfQuantities": "quantitykind:Temperature",
						"qudt:QuantityKind": "unit:K"
					},
					"dataset:dynamicType": "dataset:FixedParameter",
					"skos:prefLabel": "Temperature",
					"dataset:uncertainty": "dataset:ImpliedDigitsUncertainty"
				},
				"dataset:paramspecentropy": {
					"qudt:Unit": {
						"qudt:SystemOfQuantities": "quantitykind:MolarEntropy",
						"qudt:QuantityKind": "unit:CAL-PER-MOL-K"
					},
					"dataset:dynamicType": "dataset:FixedParameter",
					"skos:prefLabel": "Entropy",
					"dataset:uncertainty": "dataset:ImpliedDigitsUncertainty"
				},
				"dataset:paramspecheatcapacity": {
					"qudt:Unit": {
						"qudt:SystemOfQuantities": "quantitykind:MolarHeatCapacity",
						"qudt:QuantityKind": "unit:J-PER-MOL-K"
					},
					"dataset:dynamicType": "FixedParameter",
					"skos:prefLabel": "Heat Capacity",
					"dataset:uncertainty": "dataset:ImpliedDigitsUncertainty"
				},
				"dataset:hdisassociationparameter": {
					"qudt:Unit": {
						"qudt:SystemOfQuantities": "quantitykind:MolarEnergy",
						"qudt:QuantityKind": "unit:KiloCAL-PER-MOL"
					},
					"dataset:dynamicType": "FixedParameter",
					"skos:prefLabel": "Hydrogen Disassociation Energy",
					"dataset:uncertainty": "dataset:EstimatedAbsoluteUncertainty"
				},
				"dataset:paramspecfrequency": {
					"qudt:Unit": {
						"qudt:SystemOfQuantities": "qudt:FrequencyUnit",
						"qudt:QuantityKind": "dataset:cmMinus1"
					},
					"dataset:dynamicType": "FixedParameter",
					"skos:prefLabel": "Frequency",
					"dataset:uncertainty": "dataset:ImpliedDigitsUncertainty"
				}
			}
			""";

	/*
	 * Input:
	 * 
	 * @param info with the following properties:
	 * UID: User ID
	 * SessionId: Session ID
	 * FileSourceFormat: From the file format, the other necessary parameters are
	 * assigned.
	 * 
	 * UID and Session ID are needed to find the current user session data in the
	 * database.
	 * The FileSourceFormat is used to find the other necessary parameters from the
	 * formatinfoString.
	 * The session data is updated with the parameters from the formatinfoString and
	 * the session data is written to the database.
	 * 
	 * Output:
	 * SessionData: Updated Session Data written to database
	 * 
	 */
	public static JsonObject initialize(JsonObject event, JsonObject info) {
		JsonObject response = null;
		Document document = MessageConstructor.startDocument("Initialize Dataset Session Variables");
		try {
			JsonObject formatinfo = JsonObjectUtilities.jsonObjectFromString(formatinfoString);
			unitinfo = JsonObjectUtilities.jsonObjectFromString(UnitParametersString);

			Element body = MessageConstructor.isolateBody(document);
			body.addElement("div").addText("UID: " + info.get(ClassLabelConstants.UID).getAsString());
			body.addElement("div").addText("Session ID: " + info.get(ClassLabelConstants.SessionId).getAsString());
			;
			JsonObject shortdescr = event.get(ClassLabelConstants.ShortTransactionDescription)
					.getAsJsonObject();
			String key = "InitializeDatasetSessionVariables-"
					+ info.get(ClassLabelConstants.SessionId).getAsString() + "-"
					+ info.get(ClassLabelConstants.FileSourceFormat).getAsString();
			shortdescr.addProperty(ClassLabelConstants.TransactionKey, key);
			String description = "Initialize Dataset Session Variables for file format:  "
					+ info.get(ClassLabelConstants.FileSourceFormat).getAsString()
					+ " for session: " + info.get(ClassLabelConstants.SessionId).getAsString()
					+ " by user: " + info.get(ClassLabelConstants.UID).getAsString();
			shortdescr.addProperty(ClassLabelConstants.ShortDescription, description);

			String fileformat = info.get(ClassLabelConstants.FileSourceFormat).getAsString();
			body.addElement("div").addText("File Format: " + fileformat);
			JsonObject minimalSessionData = new JsonObject();
			minimalSessionData.addProperty(AnnotationObjectsLabels.identifier,
					ClassLabelConstants.SessionData);
			minimalSessionData.addProperty(ClassLabelConstants.SessionId,
					info.get(ClassLabelConstants.SessionId).getAsString());
			minimalSessionData.addProperty(ClassLabelConstants.UID, info.get(ClassLabelConstants.UID).getAsString());
			JsonObject formatdata = formatinfo.get(fileformat).getAsJsonObject();
			JsonObject sessiondataresponse = SessionDataManagement.readSessionData(minimalSessionData);
			JsonObject sessiondata = null;
			if (sessiondataresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				sessiondata = sessiondataresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
				if (sessiondata != null) {
					for (Map.Entry<String, JsonElement> entry : formatdata.entrySet()) {
						sessiondata.add(entry.getKey(), entry.getValue());
					}
					sessiondata.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer,
							info.get(ClassLabelConstants.UID).getAsString());
					sessiondata.addProperty(ClassLabelConstants.UploadFileSource,
							"dataset:GCSSourceFile");
					addPrerequisitesToSession(sessiondata, formatdata);
					addSupplementaryParametersToSession(sessiondata, formatdata);
					JsonObject updatebody = new JsonObject();
					updatebody.add(ClassLabelConstants.SessionData, sessiondata);
					String writeresponse = SessionDataManagement.updateSessionData(updatebody);
					JsonArray arr = new JsonArray();
					arr.add(sessiondata);
					if (!writeresponse.startsWith("ERROR")) {
						response = StandardResponse.standardServiceResponse(document,
								"Session data initialized successfully", arr);
					} else {
						response = StandardResponse.standardErrorResponse(document,
								"Error in writing session data: " + writeresponse, null);
					}
				} else {
					response = StandardResponse.standardErrorResponse(document,
							"Error in reading session data: "
									+ sessiondataresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString(),
							null);
				}

			}
		} catch (Exception e) {
			e.printStackTrace();
			response = StandardResponse.standardErrorResponse(document,
					"Error in reading session data: "
							+ e.getMessage(),
					null);
		}
		return response;
	}

	private static void addPrerequisitesToSession(JsonObject sessiondata, JsonObject formatdata) {
		JsonObject json = new JsonObject();
		json.add(ClassLabelConstants.TransactionID, formatdata.get(ClassLabelConstants.TransactionID));
		JsonObject response = GenerateOrderedListOfPrerequisites.generate(json);
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonArray arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
			JsonObject dataobject = arr.get(0).getAsJsonObject();
			JsonArray requiredtransactions = dataobject.get(ClassLabelConstants.RequiredTransactionID).getAsJsonArray();
			requiredtransactions.add(formatdata.get(ClassLabelConstants.TransactionID));
			sessiondata.add(ClassLabelConstants.RequiredTransactionID, requiredtransactions);
		}
	}

	private static void addSupplementaryParametersToSession(JsonObject sessiondata, JsonObject formatdata) {
		JsonObject supplementaryparameters = formatdata.get("dataset:supplementaryparameters").getAsJsonObject();
		for (String key : supplementaryparameters.keySet()) {
			if (key.equals("qudt:hasUnitSystem")) {
				JsonArray supplementaryparametersarray = supplementaryparameters.get("qudt:hasUnitSystem")
						.getAsJsonArray();
				for (int i = 0; i < supplementaryparametersarray.size(); i++) {
					String unit = supplementaryparametersarray.get(i).getAsString();
					JsonObject param = unitinfo.get(unit).getAsJsonObject();
					sessiondata.add(unit, param);
				}
			} else {
				sessiondata.addProperty(key, supplementaryparameters.get(key).getAsString());
			}
		}
		sessiondata.remove("dataset:supplementaryparameters");
	}
}
