/**
 * 
 */
package info.esblurock.background.services.datamanipulation;

import java.util.StringTokenizer;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.utilities.XMLUtilityRoutines;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import jThergas.data.read.JThergasTokenizer;
import jThergas.exceptions.JThergasReadException;

/**
 * @author edwardblurock
 *
 */
public enum PartitionSetOfStringObjects {
	PartitionTherGasThermodynamics {

		@Override
		void partition(JsonArray partitionarr, JsonObject info, String transactionID, String content, Document document) {
			String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			JThergasTokenizer tokenizer = new JThergasTokenizer(content);
			int count = 0;
			while (tokenizer.countTokens() > 2) {
				String owner = info.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
				JsonObject block = BaseCatalogData.createStandardDatabaseObject(
						"dataset:RepositoryTherGasThermodynamicsBlock", owner, transactionID, "false");
				block.addProperty(ClassLabelConstants.Position, count);
				JsonObject thermoblock = block.get(ClassLabelConstants.RepositoryThermoPartitionBlock)
						.getAsJsonObject();
				Element body = MessageConstructor.isolateBody(document);
				try {
					tokenizer.readBlock();
					thermoblock.addProperty(ClassLabelConstants.ThermodynamicsTherGasLine1, tokenizer.line1);
					thermoblock.addProperty(ClassLabelConstants.ThermodynamicsTherGasLine1a, tokenizer.line1a);
					thermoblock.addProperty(ClassLabelConstants.ThermodynamicsTherGasLine2, tokenizer.line2);
					thermoblock.addProperty(ClassLabelConstants.ThermodynamicsTherGasLine3, tokenizer.line3);
					thermoblock.addProperty(ClassLabelConstants.Position, count);
					block.addProperty(ClassLabelConstants.ShortDescription, tokenizer.line1);
					partitionarr.add(block);
					String lne = count + ":" + tokenizer.line1 + "\n";
					body.addElement("pre").addText(lne);
					count++;
				} catch (JThergasReadException e) {
				    body.addElement("pre").addText("Error: " + count + ":  " + e.getMessage() + "\n");
					partitionarr.add(block);
					count++;
				}
			}
		}

		@Override
		String getBlockClass() {
			return "dataset:RepositoryTherGasThermodynamicsBlock";

		}

	},
	PartitionToLineSet {

		@Override
		void partition(JsonArray partitionarr, JsonObject info, String transactionID, String content, Document document) {
			String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			int sze = info.get(ClassLabelConstants.BlockLineCount).getAsInt();
			StringTokenizer tok = new StringTokenizer(content, "\n");
			int count = sze;
			int position = 0;
			JsonArray linearr = new JsonArray();
			String owner = info.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			while (tok.hasMoreElements()) {
				if (count > 0) {
					linearr.add(tok.nextToken());
					count--;
				}
				if (count == 0) {
					JsonObject block = BaseCatalogData.createStandardDatabaseObject(
							"dataset:RepositoryParsedToFixedBlockSize", owner, transactionID, "false");
					block.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
					block.add(ClassLabelConstants.ParsedLine, linearr);
					block.addProperty(ClassLabelConstants.BlockLineCount, sze);
					block.addProperty(ClassLabelConstants.Position, position);
					block.addProperty(ClassLabelConstants.ShortDescription, linearr.get(0).getAsString());
					partitionarr.add(block);
					linearr = new JsonArray();
					count = sze;
					position++;
				}
			}
		}

		@Override
		String getBlockClass() {
			return "dataset:RepositoryParsedToFixedBlockSize";

		}

	}, PartitionXMLListOfCatalogObjects {

		@Override
		void partition(JsonArray partitionarr, JsonObject info, String transactionID, String content, Document document) {
			String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String catalogid = info.get(ClassLabelConstants.FileSourceFormat).getAsString();
			String[] blocks = XMLUtilityRoutines.parseObjectsFromXMLString(content, catalogid);
			String owner = info.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			for(int position = 0; position < blocks.length;position++) {
				String portion = blocks[position];
				JsonArray linearr = new JsonArray();
				linearr.add(portion);
					JsonObject block = BaseCatalogData.createStandardDatabaseObject(
							"dataset:RepositoryParsedToFixedBlockSize", owner, transactionID, "false");
					block.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
					block.add(ClassLabelConstants.ParsedLine, linearr);
					block.addProperty(ClassLabelConstants.BlockLineCount, portion.length());
					block.addProperty(ClassLabelConstants.Position, position);
					
					block.addProperty(ClassLabelConstants.ShortDescription, "XML Portion " + position);
					partitionarr.add(block);
			}
		}

		@Override
		String getBlockClass() {
			return "dataset:RepositoryParsedToFixedBlockSize";

		}

	};

	abstract void partition(JsonArray partitionarr, JsonObject info, String transactionID, String content, Document document);

	abstract String getBlockClass();

	/**
	 * @param info    The activity information (here )
	 * @param content The string holding the content to be parsed.
	 * @return The set of partition objects
	 * 
	 *         The partition catalog objects are specific subclasses of
	 *         RepositoryDataPartitionBlock corresponding to type of partitioning.
	 * 
	 *         The activity info is used to get:
	 *         <ul>
	 *         <li>used to get BlockLineCount, if it exists
	 *         <li>The method of partitioning (FilePartitionMethod)
	 *         <ul>
	 */
	public static JsonArray partitionString(JsonObject info, String transactionID, String content, Document document) {
		JsonArray partitionarr = new JsonArray();
		PartitionSetOfStringObjects method = getMethod(info);
		method.partition(partitionarr, info, transactionID, content,document);
		return partitionarr;
	}

	private static PartitionSetOfStringObjects getMethod(JsonObject info) {
		String methodS = info.get(ClassLabelConstants.FilePartitionMethod).getAsString();
		String methodkey = methodS.substring(8);
		return PartitionSetOfStringObjects.valueOf(methodkey);

	}

	public static String getBlockClass(JsonObject info) {
		PartitionSetOfStringObjects method = getMethod(info);
		return method.getBlockClass();
	}

}
