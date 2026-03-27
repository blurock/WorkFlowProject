package info.esblurock.background.services.structure;

import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.junit.Test;
import org.openscience.cdk.ChemFile;
import org.openscience.cdk.ChemModel;
import org.openscience.cdk.exception.CDKException;
import org.openscience.cdk.interfaces.IAtomContainer;
import org.openscience.cdk.interfaces.IAtomContainerSet;
import org.openscience.cdk.interfaces.IChemFile;
import org.openscience.cdk.interfaces.IChemObject;
import org.openscience.cdk.interfaces.IChemSequence;
import org.openscience.cdk.io.CMLReader;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class TestReadCMLMolecules {

	@Test
	public void test() {
		String srcpath = "src/test/java/resources/cmlmoleculeset/MoleculeSet.cml";
		File file = new File(srcpath);

		InputStream str;
		try {
			str = new FileInputStream(file);
			CMLReader reader = new CMLReader(str);
			IChemObject chemobj = reader.read(new ChemFile());
			IChemFile chemfile = (IChemFile) chemobj;
			System.out.println(" Number of sequences: " + chemfile.getChemSequenceCount());
			IChemSequence chemSequence = chemfile.getChemSequence(0);
			System.out.println(chemSequence.getProperties());
			ChemModel chemModel = (ChemModel) chemSequence.getChemModel(0);
			IAtomContainerSet setOfMolecules = chemModel.getMoleculeSet();
			System.out.println(setOfMolecules.getAtomContainerCount());
			for (int i = 0; i < setOfMolecules.getAtomContainerCount(); i++) {
				IAtomContainer molecule = (IAtomContainer) setOfMolecules.getAtomContainer(i);
				System.out.println(molecule.getID());
			}
			reader.close();
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		/*
		 * IChemSequence chemSequence = chemfile.getChemSequence(0); ChemModel chemModel
		 * = (ChemModel) chemSequence.getChemModel(0);
		 * 
		 * IAtomContainerSet setOfMolecules = chemModel.getMoleculeSet(); IAtomContainer
		 * molecule = (IAtomContainer) setOfMolecules.getAtomContainer(0);
		 * setAromaticAtomsFromBonds(molecule);
		 */
		catch (CDKException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		try {
			DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
			dbf.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);

			// parse XML file
			DocumentBuilder db = dbf.newDocumentBuilder();

			Document doc = db.parse(new File(srcpath));
	          System.out.println("Root Element :" + doc.getDocumentElement().getNodeName());
	          System.out.println("------");
	          
	          NodeList list = doc.getElementsByTagName("symmetrydefinition");
	          System.out.println("Number of elements: " + list.getLength());
	          for (int temp = 0; temp < list.getLength(); temp++) {

	              Node node = list.item(temp);
	              if (node.getNodeType() == Node.ELEMENT_NODE) {

	                  Element element = (Element) node;

	               String firstname = element.getElementsByTagName("firstname").item(0).getTextContent();
	              }
	          }	          

		} catch (ParserConfigurationException | SAXException | IOException e) {
			e.printStackTrace();
		}

	}

}
