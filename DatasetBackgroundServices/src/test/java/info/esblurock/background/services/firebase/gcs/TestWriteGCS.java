package info.esblurock.background.services.firebase.gcs;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.SystemObjectInformation;
import info.esblurock.background.services.firestore.gcs.WriteCloudStorage;
import info.esblurock.background.services.servicecollection.DatabaseServicesBase;

public class TestWriteGCS {

	@Test
	public void test() {
		String owner = SystemObjectInformation.determineOwner();
		String content = " 13   1 1 h(.)              hydrogene atome               0 1.0 1.0     2 1.0j73\n"
				+ " 13   1 2  1  52.100 1  27.40015  5.00  5.00  5.00  5.00  5.00  5.00  5.00 7 j73\n"
				+ " 13   1 3  0 0  0  0  0  0  0  0  0  1  0  0  0  0  0  0  0  0  0  0  0  0  0j73\n"
				+ " 13   2 1 'br'(.)           bromo                         0 1.0 1.0     2 1.0j73\n"
				+ " 13   2 2  1  26.700 1  41.80015  5.00  5.00  5.00  5.10  5.10  5.10  5.30 7 j73\n"
				+ " 13   2 3  0 0  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0j73\n"
				+ " 13   3 1 'cl'(.)           chloro                        0 1.0 1.0     2 1.0j73\n"
				+ " 13   3 2  1  28.900 1  39.50015  5.20  5.30  5.40  5.40  5.30  5.30  5.20 7 j73\n"
				+ " 13   3 3  0 0  0  0  0  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0j73\n"
				+ " 13   4 1 f(.)              fluoro                        0 1.0 1.0     2 1.0j73\n"
				+ " 13   4 2  1  18.900 1  37.90015  5.40  5.35  5.30  5.20  5.10  5.00  5.00 7 j73\n"
				+ " 13   4 3  0 0  0  0  0  0  0  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0j73\n" + "";
		String transactionid = SystemObjectInformation.determineTransactionID();
		// JsonObject response = WriteCloudStorage.writeString(content,
		// owner,"thergasspecieslist",transactionid);
	}

}
