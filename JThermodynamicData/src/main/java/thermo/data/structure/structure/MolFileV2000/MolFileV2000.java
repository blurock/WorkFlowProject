package thermo.data.structure.structure.MolFileV2000;

import org.openscience.cdk.interfaces.IAtomContainer;
import org.openscience.cdk.io.MDLV2000Reader;
import org.openscience.cdk.renderer.generators.standard.StandardGenerator;
import org.openscience.cdk.io.IChemObjectReader;
import org.openscience.cdk.AtomContainer;
import org.openscience.cdk.geometry.AtomTools;

import thermo.compute.utilities.MoleculeNormalization;
import thermo.data.structure.structure.NormalizeMoleculeFromCMLStructure;

import thermo.data.structure.structure.StructureAsCML;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.IOException;

public class MolFileV2000 {
    IAtomContainer molecule = null;

    public IAtomContainer readAtomContainerFromMolFileV2000FromString(String molfile) {
        try (InputStream input = new ByteArrayInputStream(molfile.getBytes())) {
            return readFromMolFileV2000(input);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    public IAtomContainer readFromMolFileV2000(InputStream input) {
        try (MDLV2000Reader reader = new MDLV2000Reader(input, IChemObjectReader.Mode.RELAXED)) {
            IAtomContainer mol = new AtomContainer();
            molecule = reader.read(mol);
            MoleculeNormalization.addHydrogens(molecule);
            AtomTools.add3DCoordinates1(molecule);
            return molecule;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public StructureAsCML readFromMolFileV2000FromString(String molfile) {
        IAtomContainer molecule = readAtomContainerFromMolFileV2000FromString(molfile);
        if (molecule != null) {
            try {
                StructureAsCML structureAsCML = new StructureAsCML(molecule);
                return structureAsCML;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return null;
    }
}