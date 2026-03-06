package info.esblurock.reaction.chemconnect.core.base;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;

import info.esblurock.reaction.chemconnect.core.base.ChemConnectCompoundDataStructure;

@Entity
@SuppressWarnings("serial")
public class ObservationValueRow extends ChemConnectCompoundDataStructure {

   @Index
   String posS;
   @Index
   String valuesstringS;

   public ObservationValueRow() {
   }

   public ObservationValueRow(ChemConnectCompoundDataStructure structure) {
      super(structure);
   }

   public String getPosition() {
         return posS;
   }
   public void setPosition(String posS) {
      this.posS = posS;
   }

   public String getListOfValuesAsString() {
         return valuesstringS;
   }
   public void setListOfValuesAsString(String valuesstringS) {
      this.valuesstringS = valuesstringS;
   }


}
