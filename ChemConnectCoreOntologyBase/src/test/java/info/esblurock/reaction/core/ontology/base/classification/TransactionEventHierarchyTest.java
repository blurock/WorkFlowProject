package info.esblurock.reaction.core.ontology.base.classification;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TransactionEventHierarchyTest {

    @Test
    public void testGenerate() {
        JsonObject result = TransactionEventHierarchy.generate();
        
        System.out.println("-------------------------------------------------------");
        System.out.println("TransactionEventHierarchy.generate()");
        System.out.println(JsonObjectUtilities.toString(result));
        System.out.println("-------------------------------------------------------");
    }

}
