package molecules.molfile;

import org.junit.Test;
import thermo.data.structure.structure.MolFileV2000.MolFileV2000;
import thermo.data.structure.structure.StructureAsCML;

public class TestMolFileV2000 {

    @Test
    public void testReadFromMolFileV2000FromString() {
        String molfile = 
              "  Ketcher  3222615322D 1   1.00000     0.00000     0\n" +
              "\n" +
              "\n" +
              "  5  4  0  0  0  0  0  0  0  0999 V2000\n" +
              "    2.3920   -4.3000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n" +
              "    3.2580   -3.8000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n" +
              "    4.1240   -4.3000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n" +
              "    4.9901   -3.8000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n" +
              "    3.2580   -2.8000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n" +
              "  1  2  1  0     0  0\n" +
              "  2  3  1  0     0  0\n" +
              "  3  4  1  0     0  0\n" +
              "  2  5  1  0     0  0\n" +
              "M  RAD  1   2   2\n" +
              "M  END";
        
        System.out.println("Testing MolFileV2000.readFromMolFileV2000FromString");
        MolFileV2000 reader = new MolFileV2000();
        StructureAsCML structAsCML = reader.readFromMolFileV2000FromString(molfile);
        
        if (structAsCML != null) {
            System.out.println(structAsCML.toString());
        } else {
            System.out.println("Result is NULL");
        }
    }
}
