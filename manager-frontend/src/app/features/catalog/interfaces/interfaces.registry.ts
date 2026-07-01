import { Type } from '@angular/core';
import { MinimumDatabaseObjectStructureComponent } from './minimum-database-object/minimum-database-object';
import { FirestoreCatalogIDComponent } from './firestore-catalog-id/firestore-catalog-id';
import { CollectionDocumentIDPairAddressComponent } from './collection-document-id-pair-address/collection-document-id-pair-address';
import { JThermodynamicStandardThermodynamicsComponent } from './j-thermodynamic-standard-thermodynamics/j-thermodynamic-standard-thermodynamics';
import { ParameterSpecificationComponent } from './parameter-specification/parameter-specification';
import { JThermodynamicMolarQuantitiesComponent } from './j-thermodynamic-molar-quantities/j-thermodynamic-molar-quantities';
import { ThermodynamicBensonRuleDefinitionComponent } from './thermodynamic-benson-rule-definition/thermodynamic-benson-rule-definition';
import { ParameterSpecificationEnthalpyComponent } from './parameter-specification-enthalpy/parameter-specification-enthalpy';
import { ParameterSpecificationEntropyComponent } from './parameter-specification-entropy/parameter-specification-entropy';
import { ParameterSpecificationTemperatureComponent } from './parameter-specification-temperature/parameter-specification-temperature';
import { ParameterSpecificationHeatCapacityComponent } from './parameter-specification-heat-capacity/parameter-specification-heat-capacity';
import { ThermodynamicStandardEnthalpyComponent } from './thermodynamic-standard-enthalpy/thermodynamic-standard-enthalpy';
import { ThermodynamicStandardEntropyComponent } from './thermodynamic-standard-entropy/thermodynamic-standard-entropy';
import { JThermodynamicsBensonConnectionWithMultiplicityComponent } from './j-thermodynamics-benson-connection-with-multiplicity/j-thermodynamics-benson-connection-with-multiplicity';
import { JThermodynamicsBensonRuleStructureComponent } from './j-thermodynamics-benson-rule-structure/j-thermodynamics-benson-rule-structure';
import { SimpleCatalogObjectComponent } from './simple-catalog-object/simple-catalog-object';
import { BibliographicReferenceLinkComponent } from './bibliographic-reference-link/bibliographic-reference-link';
import { ObjectSiteReferenceComponent } from './object-site-reference/object-site-reference';
import { DataObjectLinkComponent } from './data-object-link/data-object-link';
import { RepositoryFileStagingComponent } from './repository-file-staging/repository-file-staging';
import { RepositoryParsedToFixedBlockSizeComponent } from './repository-parsed-to-fixed-block-size/repository-parsed-to-fixed-block-size';
import { RepositoryTherGasThermodynamicsBlockComponent } from './repository-ther-gas-thermodynamics-block/repository-ther-gas-thermodynamics-block';
import { JThermodynamicsVibrationalStructureDatabaseComponent } from './j-thermodynamics-vibrational-structure-database/j-thermodynamics-vibrational-structure-database';
import { JThermodynamicsVibrationalStructureDataSetComponent } from './j-thermodynamics-vibrational-structure-data-set/j-thermodynamics-vibrational-structure-data-set';
import { JThermodynamicsVibrationalStructureWithCountComponent } from './j-thermodynamics-vibrational-structure-with-count/j-thermodynamics-vibrational-structure-with-count';
import { JThermodynamicsSymmetryStructureDefinitionDatabaseComponent } from './j-thermodynamics-symmetry-structure-definition-database/j-thermodynamics-symmetry-structure-definition-database';
import { JThermodynamicsSymmetryStructureDefinitionDataSetComponent } from './j-thermodynamics-symmetry-structure-definition-data-set/j-thermodynamics-symmetry-structure-definition-data-set';
import { JThermodynamicsMetaAtomDefinitionDatabaseComponent } from './j-thermodynamics-meta-atom-definition-database/j-thermodynamics-meta-atom-definition-database';
import { JThermodynamicsMetaAtomDefinitionDataSetComponent } from './j-thermodynamics-meta-atom-definition-data-set/j-thermodynamics-meta-atom-definition-data-set';
import { JThermodynamicsDisassociationEnergyOfStructureDatabaseComponent } from './j-thermodynamics-disassociation-energy-of-structure-database/j-thermodynamics-disassociation-energy-of-structure-database';
import { JThermodynamicsDisassociationEnergyOfStructureDataSetComponent } from './j-thermodynamics-disassociation-energy-of-structure-data-set/j-thermodynamics-disassociation-energy-of-structure-data-set';
import { ThermodynamicBensonRuleDefinitionDatabaseComponent } from './thermodynamic-benson-rule-definition-database/thermodynamic-benson-rule-definition-database';
import { ThermodynamicBensonRuleDefinitionDataSetComponent } from './thermodynamic-benson-rule-definition-data-set/thermodynamic-benson-rule-definition-data-set';
import { JThermodynamics2DSubstructureThermodynamicsDataSetComponent } from './j-thermodynamics2d-substructure-thermodynamics-data-set/j-thermodynamics2d-substructure-thermodynamics-data-set';
import { JThermodynamics2DSubstructureThermodynamicsDatabaseComponent } from './j-thermodynamics2d-substructure-thermodynamics-database/j-thermodynamics2d-substructure-thermodynamics-database';
import { JThermodynamics2DMoleculeThermodynamicsDatabaseComponent } from './j-thermodynamics2d-molecule-thermodynamics-database/j-thermodynamics2d-molecule-thermodynamics-database';
import { JThermodynamics2DMoleculeThermodynamicsDataSetComponent } from './j-thermodynamics2d-molecule-thermodynamics-data-set/j-thermodynamics2d-molecule-thermodynamics-data-set';
import { DatasetTransactionEventObjectComponent } from './dataset-transaction-event-object/dataset-transaction-event-object';
import { DatasetCollectionObjectSetManipulationTransactionComponent } from './dataset-collection-object-set-manipulation-transaction/dataset-collection-object-set-manipulation-transaction';
import { UserManagementTransactionObjectComponent } from './user-management-transaction-object/user-management-transaction-object';
import { DatasetSystemCollectionManagementTransactionComponent } from './dataset-system-collection-management-transaction/dataset-system-collection-management-transaction';
import { DatasetCollectionObjectSetWriteTransactionComponent } from './dataset-collection-object-set-write-transaction/dataset-collection-object-set-write-transaction';
import { DataCollectionAddCollectionTransactionComponent } from './data-collection-add-collection-transaction/data-collection-add-collection-transaction';
import { ChemConnectUpdateCatalogObjectTransactionComponent } from './chem-connect-update-catalog-object-transaction/chem-connect-update-catalog-object-transaction';
import { ActivityInformationRecordComponent } from './activity-information/activity-information';
import { JThermodynamicBensonTemperaturesComponent } from './j-thermodynamic-benson-temperatures/j-thermodynamic-benson-temperatures';

export const INTERFACE_REGISTRY: Record<string, Type<any>> = {
  'dataset:MinimumDatabaseObjectStructure': MinimumDatabaseObjectStructureComponent,
  'dataset:FirestoreCatalogID': FirestoreCatalogIDComponent,
  'dataset:CollectionDocumentIDPairAddress': CollectionDocumentIDPairAddressComponent,
  'dataset:FirebaseCatalogIDForModifiedObject': FirestoreCatalogIDComponent,
  'dataset:RelatedCatalogObjectIDAndType': FirestoreCatalogIDComponent,
  'dataset:DatabasePersonObjectID': FirestoreCatalogIDComponent,
  'dataset:ActivityInformationRecordID': FirestoreCatalogIDComponent,
  'dataset:DataCatalogOutputObjectReplaced': FirestoreCatalogIDComponent,
  'dataset:DatabaseObjectIDOutputTransaction': FirestoreCatalogIDComponent,
  'dataset:UserAccountObjectID': FirestoreCatalogIDComponent,
  'dataset:FirestoreCatalogIDForTransaction': FirestoreCatalogIDComponent,
  'dataset:RequiredTransactionIDAndType': FirestoreCatalogIDComponent,
  'dataset:DatabaseIDFromRequiredTransaction': FirestoreCatalogIDComponent,
  'dataset:DataCatalogOutputObjectID': FirestoreCatalogIDComponent,
  'dataset:JThermodynamicStandardThermodynamics': JThermodynamicStandardThermodynamicsComponent,
  'dataset:ParameterSpecification': ParameterSpecificationComponent,
  'dataset:ParameterSpecificationEnthalpy': ParameterSpecificationEnthalpyComponent,
  'dataset:ParameterSpecificationEntropy': ParameterSpecificationEntropyComponent,
  'dataset:ParameterSpecificationHeatCapacity': ParameterSpecificationHeatCapacityComponent,
  'dataset:ParameterSpecificationHDisassociationEnergy': ParameterSpecificationComponent,
  'dataset:ParameterSpecificationStructureVibrationFrequency': ParameterSpecificationComponent,
  'dataset:ParameterSpecificationTemperature': ParameterSpecificationTemperatureComponent,
  'dataset:JThermodynamicMolarQuantities': JThermodynamicMolarQuantitiesComponent,
  'dataset:ThermodynamicStandardEnthalpy': ThermodynamicStandardEnthalpyComponent,
  'dataset:ThermodynamicStandardEntropy': ThermodynamicStandardEntropyComponent,
  'dataset:ThermodynamicHeatCapacity': JThermodynamicMolarQuantitiesComponent,
  'dataset:JThermodynamicDisassociationEnergy': JThermodynamicMolarQuantitiesComponent,
  'dataset:ThermodynamicBensonRuleDefinition': ThermodynamicBensonRuleDefinitionComponent,
  'dataset:JThermodynamicsBensonConnectionWithMultiplicity': JThermodynamicsBensonConnectionWithMultiplicityComponent,
  'dataset:JThermodynamicsBensonRuleStructure': JThermodynamicsBensonRuleStructureComponent,
  'dataset:SimpleCatalogObject': SimpleCatalogObjectComponent,
  'dcterms:BibliographicResource': BibliographicReferenceLinkComponent,
  'dataset:bibliographicreferencelink': BibliographicReferenceLinkComponent,
  'foaf:page': ObjectSiteReferenceComponent,
  'dataset:ObjectSiteReference': ObjectSiteReferenceComponent,
  'skos:mappingRelation': DataObjectLinkComponent,
  'dataset:RepositoryFileStaging': RepositoryFileStagingComponent,
  'dataset:RepositoryParsedToFixedBlockSize': RepositoryParsedToFixedBlockSizeComponent,
  'dataset:RepositoryTherGasThermodynamicsBlock': RepositoryTherGasThermodynamicsBlockComponent,
  'dataset:JThermodynamicsVibrationalStructureDatabase': JThermodynamicsVibrationalStructureDatabaseComponent,
  'dataset:JThermodynamicsVibrationalStructureDataSet': JThermodynamicsVibrationalStructureDataSetComponent,
  'dataset:JThermodynamicsVibrationalStructureWithCount': JThermodynamicsVibrationalStructureWithCountComponent,
  'dataset:JThermodynamicsSymmetryStructureDefinitionDatabase': JThermodynamicsSymmetryStructureDefinitionDatabaseComponent,
  'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet': JThermodynamicsSymmetryStructureDefinitionDataSetComponent,
  'dataset:JThermodynamicsMetaAtomDefinitionDatabase': JThermodynamicsMetaAtomDefinitionDatabaseComponent,
  'dataset:JThermodynamicsMetaAtomDefinitionDataSet': JThermodynamicsMetaAtomDefinitionDataSetComponent,
  'dataset:JThermodynamicsDisassociationEnergyOfStructureDatabase': JThermodynamicsDisassociationEnergyOfStructureDatabaseComponent,
  'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet': JThermodynamicsDisassociationEnergyOfStructureDataSetComponent,
  'dataset:ThermodynamicBensonRuleDefinitionDatabase': ThermodynamicBensonRuleDefinitionDatabaseComponent,
  'dataset:ThermodynamicBensonRuleDefinitionDataSet': ThermodynamicBensonRuleDefinitionDataSetComponent,
  'dataset:JThermodynamics2DSubstructureThermodynamicsDataSet': JThermodynamics2DSubstructureThermodynamicsDataSetComponent,
  'dataset:JThermodynamics2DSubstructureThermodynamicsDatabase': JThermodynamics2DSubstructureThermodynamicsDatabaseComponent,
  'dataset:JThermodynamics2DMoleculeThermodynamicsDatabase': JThermodynamics2DMoleculeThermodynamicsDatabaseComponent,
  'dataset:JThermodynamics2DMoleculeThermodynamicsDataSet': JThermodynamics2DMoleculeThermodynamicsDataSetComponent,
  'dataset:DatasetTransactionEventObject': DatasetTransactionEventObjectComponent,
  'dataset:DatasetCollectionObjectSetManipulationTransaction': DatasetCollectionObjectSetManipulationTransactionComponent,
  'dataset:UserManagementTransactionObject': UserManagementTransactionObjectComponent,
  'dataset:DatasetSystemCollectionManagementTransaction': DatasetSystemCollectionManagementTransactionComponent,
  'dataset:DatasetCollectionObjectSetWriteTransaction': DatasetCollectionObjectSetWriteTransactionComponent,
  'dataset:DataCollectionAddCollectionTransaction': DataCollectionAddCollectionTransactionComponent,
  'dataset:ChemConnectUpdateCatalogObjectTransaction': ChemConnectUpdateCatalogObjectTransactionComponent,
  'dataset:ActivityInformationRecord': ActivityInformationRecordComponent,
  'dataset:JThermodynamicBensonTemperatures': JThermodynamicBensonTemperaturesComponent,
  'dataset:bensontemperaturelist': JThermodynamicBensonTemperaturesComponent,
};

const IDENTIFIER_TO_CLASSNAME: Record<string, string> = {
  'dataset:jthermostandardthermo': 'dataset:JThermodynamicStandardThermodynamics',
  'dataset:paramspecenthalpy': 'dataset:ParameterSpecificationEnthalpy',
  'dataset:paramspecentropy': 'dataset:ParameterSpecificationEntropy',
  'dataset:paramspecheatcapacity': 'dataset:ParameterSpecificationHeatCapacity',
  'dataset:paramspecfrequency': 'dataset:ParameterSpecificationStructureVibrationFrequency',
  'dataset:hdisassociationparameter': 'dataset:ParameterSpecificationHDisassociationEnergy',
  'dataset:thermotemperature': 'dataset:ParameterSpecificationTemperature',
  'dataset:ThermodynamicTemperature': 'dataset:ParameterSpecificationTemperature',
  'dataset:stdenthalpy': 'dataset:ThermodynamicStandardEnthalpy',
  'dataset:stdentropy': 'dataset:ThermodynamicStandardEntropy',
  'dataset:heatcapacity': 'dataset:ThermodynamicHeatCapacity',
  'dataset:bensonrule': 'dataset:ThermodynamicBensonRuleDefinition',
  'dataset:bensonruledataset': 'dataset:ThermodynamicBensonRuleDefinitionDataSet',
  'dataset:bensonruledatabase': 'dataset:ThermodynamicBensonRuleDefinitionDatabase',
  'dataset:connectmult': 'dataset:JThermodynamicsBensonConnectionWithMultiplicity',
  'dataset:bensonrulestructure': 'dataset:JThermodynamicsBensonRuleStructure',
  'dcterms:BibliographicResource': 'dcterms:BibliographicResource',
  'dataset:bibliographicreferencelink': 'dcterms:BibliographicResource',
  'terms:BibliographicResource': 'dcterms:BibliographicResource',
  'foaf:page': 'foaf:page',
  'dataset:ObjectSiteReference': 'foaf:page',
  'skos:mappingRelation': 'skos:mappingRelation',
  'dataset:firestorecatalog': 'dataset:FirestoreCatalogIDForTransaction',
  'dataset:transactionforobject': 'dataset:FirestoreCatalogIDForTransaction',
  'dataset:activityinfo': 'dataset:ActivityInformationRecord',
  'dataset:RepositoryFileStaging': 'dataset:RepositoryFileStaging',
  'dataset:RepositoryParsedToFixedBlockSize': 'dataset:RepositoryParsedToFixedBlockSize',
  'dataset:RepositoryTherGasThermodynamicsBlock': 'dataset:RepositoryTherGasThermodynamicsBlock',
  'dataset:JThermodynamicsVibrationalStructureDatabase': 'dataset:JThermodynamicsVibrationalStructureDatabase',
  'dataset:JThermodynamicsVibrationalStructureDataSet': 'dataset:JThermodynamicsVibrationalStructureDataSet',
  'dataset:JThermodynamicsVibrationalStructureWithCount': 'dataset:JThermodynamicsVibrationalStructureWithCount',
  'dataset:JThermodynamicsSymmetryStructureDefinitionDatabase': 'dataset:JThermodynamicsSymmetryStructureDefinitionDatabase',
  'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet': 'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet',
  'dataset:JThermodynamicsMetaAtomDefinitionDatabase': 'dataset:JThermodynamicsMetaAtomDefinitionDatabase',
  'dataset:JThermodynamicsMetaAtomDefinitionDataSet': 'dataset:JThermodynamicsMetaAtomDefinitionDataSet',
  'dataset:JThermodynamicsDisassociationEnergyOfStructureDatabase': 'dataset:JThermodynamicsDisassociationEnergyOfStructureDatabase',
  'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet': 'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet',
  'dataset:ThermodynamicBensonRuleDefinitionDatabase': 'dataset:ThermodynamicBensonRuleDefinitionDatabase',
  'dataset:ThermodynamicBensonRuleDefinitionDataSet': 'dataset:ThermodynamicBensonRuleDefinitionDataSet',
  'dataset:JThermodynamics2DSubstructureThermodynamicsDataSet': 'dataset:JThermodynamics2DSubstructureThermodynamicsDataSet',
  'dataset:JThermodynamics2DSubstructureThermodynamicsDatabase': 'dataset:JThermodynamics2DSubstructureThermodynamicsDatabase',
  'dataset:JThermodynamics2DMoleculeThermodynamicsDatabase': 'dataset:JThermodynamics2DMoleculeThermodynamicsDatabase',
  'dataset:JThermodynamics2DMoleculeThermodynamicsDataSet': 'dataset:JThermodynamics2DMoleculeThermodynamicsDataSet',
  'dataset:DatasetTransactionEventObject': 'dataset:DatasetTransactionEventObject',
  'dataset:DatasetCollectionObjectSetManipulationTransaction': 'dataset:DatasetCollectionObjectSetManipulationTransaction',
  'dataset:UserManagementTransactionObject': 'dataset:UserManagementTransactionObject',
  'dataset:DatasetSystemCollectionManagementTransaction': 'dataset:DatasetSystemCollectionManagementTransaction',
  'dataset:DatasetCollectionObjectSetWriteTransaction': 'dataset:DatasetCollectionObjectSetWriteTransaction',
  'dataset:DataCollectionAddCollectionTransaction': 'dataset:DataCollectionAddCollectionTransaction',
  'dataset:ChemConnectUpdateCatalogObjectTransaction': 'dataset:ChemConnectUpdateCatalogObjectTransaction',
  'dataset:bensontemperaturelist': 'dataset:JThermodynamicBensonTemperatures',
};

export function resolveCustomInterface(classname: string): Type<any> | undefined {
  const resolvedKey = IDENTIFIER_TO_CLASSNAME[classname] || classname;
  return INTERFACE_REGISTRY[resolvedKey];
}
