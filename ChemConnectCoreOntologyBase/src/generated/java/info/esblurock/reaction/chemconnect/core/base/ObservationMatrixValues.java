package info.esblurock.reaction.chemconnect.core.base;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;

import info.esblurock.reaction.chemconnect.core.base.ChemConnectCompoundDataStructure;

@Entity
@SuppressWarnings("serial")
public class ObservationMatrixValues extends ChemConnectCompoundDataStructure {

   @Index
   String numcolsS;
   @Index
   String rowS;

   public ObservationMatrixValues() {
   }

   public ObservationMatrixValues(ChemConnectCompoundDataStructure structure) {
      super(structure);
   }

   public String getNumberOfColumns() {
         return numcolsS;
   }
   public void setNumberOfColumns(String numcolsS) {
      this.numcolsS = numcolsS;
   }

   public String getObservationValueRow() {
         return rowS;
   }
   public void setObservationValueRow(String rowS) {
      this.rowS = rowS;
   }


}
