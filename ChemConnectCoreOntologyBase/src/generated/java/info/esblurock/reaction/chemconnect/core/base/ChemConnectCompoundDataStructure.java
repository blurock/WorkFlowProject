package info.esblurock.reaction.chemconnect.core.base;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;

import info.esblurock.reaction.chemconnect.core.base.DatabaseObject;

@Entity
@SuppressWarnings("serial")
public class ChemConnectCompoundDataStructure extends DatabaseObject {

   @Index
   String parentS;

   public ChemConnectCompoundDataStructure() {
   }

   public ChemConnectCompoundDataStructure(DatabaseObject structure) {
      super(structure);
   }

   public String getParentLinkToDataStructure() {
         return parentS;
   }
   public void setParentLinkToDataStructure(String parentS) {
      this.parentS = parentS;
   }


}
