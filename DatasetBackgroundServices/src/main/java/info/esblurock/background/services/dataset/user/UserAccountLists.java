package info.esblurock.background.services.dataset.user;

import java.util.ArrayList;

import org.dom4j.Document;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.ManageDatasetDocumentLists;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public class UserAccountLists {
    
    public static JsonObject getListOfUserAccountNames() {
        return getListOfNamesAsResponse("dataset:UserAccount");
    }
    public static JsonObject getListOfNewUserAccountNames() {
        return getListOfNamesAsResponse("dataset:NewUserAccount");
    }
    
    public static ArrayList<String> getListOfNameIDs(String classname) {
        boolean ans = true;
        ArrayList<String> accountids = ManageDatasetDocumentLists.getCollectionIDsForClass(classname);
        return accountids;
    }

    
    public static ArrayList<String> getListOfNames(String username) {
        boolean ans = true;
       ArrayList<String> accountids = ManageDatasetDocumentLists.getCollectionIDsForClass("dataset:UserAccount");
        if (accountids.contains(username)) {
            accountids = null;
        } else {

        }
        return accountids;
    }

    
    public static JsonObject getListOfNamesAsResponse(String classname) {
        Document document = MessageConstructor.startDocument("List of " + classname);
        ArrayList<String> ids = ManageDatasetDocumentLists.getCollectionIDsForClass(classname);
        JsonArray jsonids = new JsonArray();
        
        for(String id : ids) {
            jsonids.add(id);
        }
        JsonObject obj = new JsonObject();
        JsonArray arr = new JsonArray();
        arr.add(obj);
        obj.add(ClassLabelConstants.username, jsonids);
        JsonObject response = StandardResponse.standardServiceResponse(document,
                "Success: SubstituteAndWriteDatabasePerson", arr);
        return response;
        
    }

}
