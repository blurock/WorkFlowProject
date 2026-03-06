package info.esblurock.reaction.core.ontology.base;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;

public class TestInsertCatalogName {

    @Test
    public void test() {
        String classname = "dataset:ThermodynamicBensonRuleDefinitionClass";
        String owner = "Administration";
        String transID = BaseCatalogData.generateUniqueUUID();
        JsonObject obj = BaseCatalogData.createStandardDatabaseObject(classname, owner, transID, "true");
        obj.addProperty(ClassLabelConstants.BensonRuleDatabaseReference, "bensonname");
        BaseCatalogData.insertCatalogObjectKey(obj,classname);
    }

}
