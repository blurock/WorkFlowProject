import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Ontologyconstants {
  public rdfslabel = 'rdfs:label';
  public rdfscomment = 'rdfs:comment';
  public dctermsidentifier = '<http://purl.org/dc/elements/1.1/identifier>';
  public dctype = 'dc:type';
  public datacitePrimaryResourceIdentifier = 'datacite:PrimaryResourceIdentifier';
  public dctermsdescription = 'dcterms:description';
  public dctermstitle = 'dcterms:title';
  public author = 'author';
  public dccreator = 'dc:creator';
  public foafFamilyName = 'foaf:familyName';
  public foafGivenName = 'foaf:givenName';
  public foaftitle = 'foaf:title';
  public datasethttpaddress = 'dataset:HttpAddress';
  public datasethttpaddresstype = 'dataset:HttpAddressType';
  public datasethttpaddresssrcloc = 'dataset:HttpAddressSourceLocation';
  public catalogtype = 'dataset:catalogtype';

  public successful = 'dataset:servicesuccessful';
  public message = 'dataset:serviceresponsemessage';
  public catalogobject = 'dataset:simpcatobj';
  public outputobject = 'dataobj';
  public annotations = 'annotations';
  public service = 'service';
  public annoinfo = "annoinfo";

  public DatabaseIDFromRequiredTransaction = 'dataset:transreqobj';

  public PartiionSetWithinRepositoryFile = 'dataset:partitionfile';
  public TransactionInterpretTextBlock = 'dataset:interprettextblocktransaction';
  public TransactionEventObject = 'dataset:eventobject';
  public TransactionEventType = 'prov:activity';
  public ActivityInfo = 'dataset:activityinfo';
  public InitialReadInOfRepositoryFile = 'dataset:initreposfile';
  public InitialReadInOfRepositoryFileActivity = 'dataset:InitialReadInOfRepositoryFile';
  public UploadFileSource = 'dataset:uploadsrc';
  public LocalFileSystem = 'dataset:LocalFileSystem';
  public StringSource = 'dataset:StringSource';
  public FileSourceIdentifier = 'dataset:fileidentifier';

  public email = 'http://www.w3.org/2006/vcard/ns#:email';
  public username = 'foaf:account';
  public UID = 'dataset:authorizationuid';
  public AuthorizationType = 'dataset:AuthorizationType';
  public UserAccount = 'prov:SoftwareAgent';
  public DatabasePerson = 'vcard:Individual';
  public UserAccountRole = 'dataset:UserAccountRole';

  public DatasetObjectSummaryTableDescriptors = 'dataset:summarytabledescriptors';
  public DatasetObjectSummaryTableSearchTerms = 'dataset:summarytablesearchterms';
  public SummaryTableDescriptionKey = 'dataset:summarytabledescriptionkey';
  public SummaryTableSearchKey = 'dataset:summarytablesearchkey';
  public DataObjectSummaryTableDescriptionTerms = 'dataset:summarytabledescriptionterms';

  public textfile = 'dataset:FileTypeText';

  public ThermodynamicsSystemCollectionIDsSet = 'dataset:systemdatasetcollection';
  public ThermodynamicsDatasetCollectionIDsSet = 'dataset:datasetcollectionids';

  public DatabaseObjectType = 'dataset:objectype';
  public CatalogObjectAccessRead = 'dataset:readaccess';
  public CatalogObjectOwner = 'dcterms:creator';
  public CatalogObjectKey = 'dataset:catalogkey';
  public CatalogObjectAccessModify = 'dataset:accessmodify';
  public TransactionID = 'transaction';
  public CatalogHiearchyNode = 'dataset:cataloghiearchynode';
  public DatasetCollectionsLabel = 'dataset:datasetcollectionslabel'

  public DatabaseObjectIDOutputTransaction = 'dataset:transoutobjid';
  public FirestoreCatalogID = 'dataset:firestorecatalog';
  public DataCatalog = 'skos:inScheme';
  public SimpleCatalogName = 'qb:DataSet';
  public CollectionDocumentIDPairAddress = 'dataset:addressidpairs';
  public CollectionDocumentIDPair = 'dataset:collectiondocpair';
  public DatasetCollectionID = 'dataset:collectionid';
  public DatasetDocumentID = 'dataset:documentid';
  public DatasetIDLevel = 'dataset:idlevel';

  public DataSetReference = 'dcterms:BibliographicResource';
  public DOI = 'datacite:PrimaryResourceIdentifier';
  public ReferenceString = 'dataset:referencestring';
  public ReferenceTitle = 'dataset:referencetitle';

  public AuthorNameTitle = 'dataset:authortitle';
  public AuthorGivenName = 'dataset:authorgivenname';
  public AuthorFamilyName = 'dataset:authorfamilyname';
  public AuthorInformation = 'dc:creator';

  public DataObjectLink = 'skos:mappingRelation';
  public DataTypeConcept = 'qb:concept';

  public ObjectSiteReference = 'foaf:page';
  public HTTPAddress = 'dataset:HttpAddress';
  public HttpAddressInformationType = 'dataset:httpinformationtype';

  public GCSBlobFileInformationStaging = 'dataset:gcsstagingblob';
  public DescriptionAbstract = 'dcterms:description';
  public FileSourceFormat = 'dataset:filesourceformat';
  public GCSFileName = 'dataset:GCSFileName';
  public GCSFilePath = 'dataset:GCSFilePath';

  public RepositoryFileStaging = 'dataset:RepositoryFileStaging';
  public DescriptionTitle = 'dcterms:title';

  public DatasetTransactionSpecificationForCollection = 'dataset:datasettransactionspecification';
  public CatalogObjectUniqueGenericLabel = 'dataset:dataset:uniquegenericname';
  public DatasetName = 'dataset:datasetname';
  public DatasetVersion = 'dataset:datasetversion';
  public CatalogDataObjectMaintainer = 'dataset:catalogobjectmaintainer';
  public CatalogDataObjectStatus = 'dataset:dataobjstatus';

  public ActivityRepositoryInitialReadInfo = 'dataset:repinitialreadinfo';
  public ActivityRepositoryInitialReadLocalFile = 'dataset:initialrepositorylocal';
  public ActivityRepositoryInitialReadStringContent = 'dataset:initialrepositorystring';
  public ActivityRepositoryInitialReadURL = 'dataset:initialrepositoryurl';

  public FileSourceMediaType = 'dataset:filemediatype';
  public FileSourceMediaSubType = 'dataset:filesourcesubtype';

  public RepositoryDataPartitionBlock = 'dataset:RepositoryDataFilePartition';
  public ActivityRepositoryPartitionToCatalog = 'dataset:partitionfilefromrepository';
  public BlockLineCount = 'dataset:blocklinecount';
  public FilePartitionMethod = 'dataset:filepartitionmethod';
  public Position = 'qb:order';

  public ActivitySpeciesCatalogObjectCreation = 'dataset:speciescatalogobjectcreation';
  public JThermodynamics2DSpeciesLabel = 'dataset:2dmollabel';
  public SpeciesRepresentationAsText = 'dataset:speciesrepresentation';
  public DateCreated = 'dcterms:created';
  public TransactionDebugMode = 'dataset:transactiondebugmode';
  public TransactionDebugModeChoices = 'dataset:TransactionDebugModeChoices';
  public TransactionDebugWriteOneCatalogObject = 'dataset:TransactionDebugWriteOneCatalogObject';
  public TransactionDebugWriteCatalogObjects = 'dataset:TransactionDebugWriteCatalogObjects';
  public TransactionDebugWriteNoCatalogObject = 'dataset:TransactionDebugWriteNoCatalogObject';
  public TransactionModifyDatabase = 'dataset:TransactionModifyDatabase';
  public SessionId = 'dataset:sessionId';
  public SessionStatus = 'datasert:sessionstatus';
  public SpeciesRepresentationType = 'dataset:molfiletype';
  public JThermodynamicsStructureFormat = 'dataset:speciesformat';
  public SpeciesRepresentationChoices = 'dataset:SpeciesRepresentationChoices';
  public SpeciesRepresentationMolFileV2000 = 'dataset:SpeciesRepresentationMolFileV2000';
  public SpeciesRepresentationNancyLinearForm = 'dataset:SpeciesRepresentationNancyLinearForm';
  public SpeciesRepresentationInChI = 'dataset:SpeciesRepresentationInChI';
  public SpeciesRepresentationSMILES = 'dataset:SpeciesRepresentationSMILES';
  public SpeciesRepresentationMolFile = 'dataset:SpeciesRepresentationMolFile';
  public SessionStatusChoices = 'dataset:SessionStatusChoices';
  public SessionStatusError = 'dataset:SessionStatusError';
  public SessionStatusComplete = 'dataset:SessionStatusComplete';
  public SessionStatusPending = 'dataset:SessionStatusPending';
  public SessionStatusProcessing = 'dataset:SessionStatusProcessing';
  public SessionStatusCatalog = 'dataset:SessionStatus';
  public JThermodynamicsStructureFormatCatalog = 'dataset:speciesformat';
  public SessionData = 'dataset:sessiondata';
  public JThermodynamicsStructureName = 'dataset:structurename';
}
