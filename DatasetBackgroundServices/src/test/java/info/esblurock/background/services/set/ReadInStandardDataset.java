package info.esblurock.background.services.set;

import static org.junit.Assert.*;

import org.junit.Test;

import info.esblurock.background.services.dataset.ReadInStandardDatasets;
import info.esblurock.background.services.firestore.InitiallizeSystem;

public class ReadInStandardDataset {

	@Test
	public void test() {
		InitiallizeSystem.initialize();
		ReadInStandardDatasets.readInStandardDatasets();;
	}

}
