package info.esblurock.background.services.dataset;

import java.util.ArrayList;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class DatasetCollectionCreateSystemCollection {
    
    public static String systemhierarchy = "systemthermodynamics";
    
    public static JsonObject processCreateSystemCollection(JsonObject event, JsonObject info) {
        JsonObject response = null;
        String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
        info.addProperty(ClassLabelConstants.SourceCollectionMaintainer,maintainer);
        info.addProperty(ClassLabelConstants.DestinationCollectionMaintainer,systemhierarchy);
        
        String systemcollectionlabel = info.get(ClassLabelConstants.SystemDatasetCollectionsSetLabel).getAsString();
        String collectionlabel = info.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
        
        info.addProperty(ClassLabelConstants.DatasetCollectionSetSourceLabel, collectionlabel);
        info.addProperty(ClassLabelConstants.DatasetCollectionSetDestinationLabel, systemcollectionlabel);
        info.addProperty(ClassLabelConstants.CollectionName, systemcollectionlabel);
        
        response = copyCollectionSet(event,info,"dataset:ThermodynamicsSystemCollectionIDsSet");
        
        return response;
    }
    
    
    /** This copies a collection set from a source to a destination, both specified by a collection set ID label
     * 
     * @param event The event of the transaction
     * @param info The information to make the copy
     * @return response
     * 
     * The SourceCollectionMaintainer combined with the DatasetCollectionSetSourceLabel specifies the 
     * collection set to be used as the source
     * The DestinationCollectionMaintainer combined with the DatasetCollectionSetDestinationLabel specifies the 
     * collection set to be used as the destination.
     * 
     * Each set of catalog objects is specified with the DatasetVersion and the DatasetVersion given in the input
     * (meaning they are all the same).
     * 
     * A DescriptionTitle is used to give a description of the destination collection.
     * 
     * TransactionID is the transaction id used to create the new collection
     * 
     * Each set of the catalog objects in the source collection is copied into the location specified by the destination collection.
     * 
     * 
     */
    public static JsonObject copyCollectionSet(JsonObject event, JsonObject info, String objecttype) {
        JsonObject response = null;
        Document document = MessageConstructor.startDocument("Dataset Collection Set Creation Event");
        Element body = MessageConstructor.isolateBody(document);
        Element successtitleelement = body.addElement("h3");
        Element successdivelement = body.addElement("div");
        String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
     
        String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
        String srcmaintainer = info.get(ClassLabelConstants.SourceCollectionMaintainer).getAsString();
        String destmaintainer = info.get(ClassLabelConstants.DestinationCollectionMaintainer).getAsString();
        
        String title = info.get(ClassLabelConstants.DescriptionTitle).getAsString();
        String srccollectionlabel = info.get(ClassLabelConstants.DatasetCollectionSetSourceLabel).getAsString();
        String destcollectionlabel = info.get(ClassLabelConstants.DatasetCollectionSetDestinationLabel).getAsString();
        String version = info.get(ClassLabelConstants.DatasetVersion).getAsString();
        String collectionname = info.get(ClassLabelConstants.CollectionName).getAsString();
        
        body.addElement("div").addText("Collection Maintainer                : " + maintainer);
        body.addElement("div").addText("Source Maintainer                    : " + srcmaintainer);
        body.addElement("div").addText("Source Collection Name               : " + srccollectionlabel);
        body.addElement("div").addText("Destination Maintainer               : " + destmaintainer);
        body.addElement("div").addText("Destination Collection Name          : " + destcollectionlabel);
        
        body.addElement("div").addText("Default Dataset Name                 : " + collectionname);
        body.addElement("div").addText("Default Version                      : " + version);
        
        JsonObject collectionsetidinfo = new JsonObject();
        collectionsetidinfo.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, srcmaintainer);
        collectionsetidinfo.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, srccollectionlabel);
        boolean success = true;
        JsonObject datasetcollectionset = DatasetCollectionManagement.getDatasetCollectionSets(collectionsetidinfo);
        body.addElement("pre").addText(JsonObjectUtilities.toString(datasetcollectionset));
        JsonObject transactionfirestore = BaseCatalogData.insertFirestoreAddress(event);
        
        
        if(datasetcollectionset != null) {
            JsonObject systemcollectionset = CreateDocumentTemplate.createTemplate(objecttype);
            systemcollectionset.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, destmaintainer);
            systemcollectionset.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, destcollectionlabel);
            systemcollectionset.addProperty(ClassLabelConstants.CatalogObjectKey, destcollectionlabel);
            systemcollectionset.addProperty(ClassLabelConstants.DescriptionAbstract, title);
            systemcollectionset.addProperty(ClassLabelConstants.DatasetCollectionType, objecttype);
            systemcollectionset.add(ClassLabelConstants.FirestoreCatalogIDForTransaction,transactionfirestore);
            
            BaseCatalogData.insertStandardBaseInformation(systemcollectionset, destmaintainer, transactionID, title);
            BaseCatalogData.insertFirestoreAddress(systemcollectionset);
            System.out.println("copyCollectionSet: " + JsonObjectUtilities.toString(systemcollectionset));
            boolean success1 = copyDatasetElements(systemcollectionset, transactionID,
                    destmaintainer, transactionfirestore,version, collectionname,datasetcollectionset, 
                    ClassLabelConstants.JThermodynamics2DSubstructureThermodynamicsDatabase,document);
            boolean success2 = copyDatasetElements(systemcollectionset, transactionID,
                    destmaintainer, transactionfirestore,version, collectionname,datasetcollectionset, 
                    ClassLabelConstants.ThermodynamicBensonRuleDefinition,document);
            boolean success3 = copyDatasetElements(systemcollectionset, transactionID,
                    destmaintainer, transactionfirestore,version, collectionname,datasetcollectionset, 
                    ClassLabelConstants.JThermodynamicsDisassociationEnergyOfStructure,document);
            boolean success4 = copyDatasetElements(systemcollectionset, transactionID,
                    destmaintainer, transactionfirestore,version, collectionname,datasetcollectionset, 
                    ClassLabelConstants.JThermodynamicsMetaAtomDefinition,document);
            boolean success5 = copyDatasetElements(systemcollectionset, transactionID,
                    destmaintainer, transactionfirestore,version, collectionname,datasetcollectionset, 
                    ClassLabelConstants.JThermodynamicsSymmetryStructureDefinition,document);
            boolean success6 = copyDatasetElements(systemcollectionset, transactionID,
                    destmaintainer, transactionfirestore,version, collectionname,datasetcollectionset, 
                    ClassLabelConstants.JThermodynamicsVibrationalStructure,document);
            
            success = success1 && success2 && success3 && success4 && success5 && success6;
            JsonArray arr = new JsonArray();
            arr.add(systemcollectionset);
            try {
                WriteFirestoreCatalogObject.writeCatalogObjectWithException(systemcollectionset);
                if(success) {
                    successtitleelement.addText("Successful Creation of System Database");
                    successdivelement.addText("All components were transferred");
                    response = StandardResponse.standardServiceResponse(document, "Success, all data transfered", arr);
                } else {
                    successtitleelement.addText("Some (non-fatal) errors found");
                    successdivelement.addText("Examine logs for details, some elements may not have been transferred");
                    response = StandardResponse.standardServiceResponse(document, "Some (non-fatal) errors found, not all objects transferred", arr);
                }
            } catch (Exception e) {
                body.addElement("div").addText("DatasetCollectionID object  not written: ");
                response = StandardResponse.standardErrorResponse(document, "Dataset Collection not found", arr);
            }
            

        } else {
            response = StandardResponse.standardErrorResponse(document, "Dataset Collection not found", null);
        }
        return response;
    }
    
    

    private static boolean copyDatasetElements(JsonObject systemcollectionset, String transactionid,
            String destmaintainer,
            JsonObject transactionfirestore, String version, String datasetname,
            JsonObject datasetcollectionset,
            String setlabel, Document document) {
       boolean success = true;
       
       Element body = MessageConstructor.isolateBody(document);
       if(datasetcollectionset.get(setlabel) != null) {
           body.addElement("div").addText("Dataset specification found: " + setlabel);
           JsonObject specification = datasetcollectionset.get(setlabel).getAsJsonObject();
           String classname = OntologyUtilityRoutines.typesFromIdentifier(setlabel);
           JsonObject colresponse = FindDatasetCollections.readInDatasetCollection(classname, specification);
           MessageConstructor.combineBodyIntoDocument(document, colresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
           if(colresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
               JsonArray array = colresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
               body.addElement("div").addText("Set of Objects " + array.size() + " found ");
               JsonObject newspecification = generateNewSpecification(version,datasetname,destmaintainer);
               systemcollectionset.add(setlabel, newspecification);
               body.addElement("pre").addText(JsonObjectUtilities.toString(newspecification));
               
               ArrayList<String> ids = new ArrayList<String>();
               for(JsonElement element : array ) {
                   JsonObject catalog = element.getAsJsonObject();
                   
                   String access = destmaintainer;
                   if(destmaintainer.equals(systemhierarchy)) {
                       access = "Public";
                   }
                   catalog.add(ClassLabelConstants.DatasetSpecificationForCollectionSet, newspecification);
                   catalog.addProperty(ClassLabelConstants.CatalogObjectOwner, destmaintainer);
                   catalog.add(ClassLabelConstants.FirestoreCatalogIDForTransaction, transactionfirestore);
                   catalog.addProperty(ClassLabelConstants.TransactionID, transactionid);
                   catalog.addProperty(ClassLabelConstants.CatalogObjectAccessRead, access);
                   catalog.addProperty(ClassLabelConstants.CatalogObjectAccessModify, destmaintainer);
                   BaseCatalogData.insertFirestoreAddress(catalog);
                   try {
                    WriteFirestoreCatalogObject.writeCatalogObjectWithException(catalog);
                    ids.add(catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString());
                } catch (Exception e) {
                    body.addElement("div").addText("Catalog Object not written: " + catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString());
                    body.addElement("div").addText(e.getMessage());
                }
               }
               JsonObject firestore = DatasetCollectionIDManagement.firebaseIDOfCollection(classname, newspecification);
               ManageDatasetDocumentLists.writeCollectionIDs(ids,firestore);
               
           } else {
               success = false;
               body.addElement("div").addText(classname + " objects not found so not written to system");
           }
           
           
       } else {
           body.addElement("div").addText("Dataset specification not found: " + setlabel);
           body.addElement("pre").addText(JsonObjectUtilities.toString(datasetcollectionset));
           body.addElement("div").addText("Dataset not transferred");
           success = false;
       }
       return success; 
    }
    
    private static JsonObject generateNewSpecification(String version, String collectionname, String destmaintainer) {
        JsonObject newspec = new JsonObject();
        newspec.addProperty(ClassLabelConstants.CatalogDataObjectStatus, "dataset:CatalogObjectStatusCurrent");
        newspec.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, destmaintainer);
        newspec.addProperty(ClassLabelConstants.DatasetVersion, version);
        newspec.addProperty(ClassLabelConstants.CollectionName, collectionname);
        return newspec;
    }
    

}
