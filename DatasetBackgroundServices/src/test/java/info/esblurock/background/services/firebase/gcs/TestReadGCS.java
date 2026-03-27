package info.esblurock.background.services.firebase.gcs;

import static org.junit.Assert.*;

import org.junit.Test;

import info.esblurock.background.services.firestore.gcs.ReadCloudStorage;

public class TestReadGCS {

	@Test
	public void test() {
		String path = "upload/Administrator/";
		String name = "4a74a924-77b6-4fe4-b71f-857a421cbb1b";
		String content = ReadCloudStorage.read(path, name);
		System.out.println(content);
	}

}
