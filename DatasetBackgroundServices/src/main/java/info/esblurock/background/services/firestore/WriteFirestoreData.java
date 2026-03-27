package info.esblurock.background.services.firestore;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@WebServlet(name = "WriteFirestoreData", urlPatterns = { "/writeempty" })
public class WriteFirestoreData extends HttpServlet {
	private static final long serialVersionUID = 1L;

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		Document document = MessageConstructor.startDocument("WriteFirestoreData empty object: ");
		Element body = MessageConstructor.isolateBody(document);
		String catalogname = request.getParameter("catalogname");
		try {
			body.addElement("h3").addText("Catalog name: " + catalogname);
			Firestore db = FirestoreBaseClass.getFirebaseDatabase();
			DocumentReference docRef = db.collection("empty").document("catalog");
			String owner = "Blurock";
			String transID = "transactionID value";
			String publicaccess = "true";
			JsonObject obj = BaseCatalogData.createStandardDatabaseObject(catalogname, owner, transID, publicaccess);
			body.addElement("h3").addText("Catalog name: " + catalogname);
			/*
			 * String classname = "dataset:DatabasePerson";
			 * 
			 * SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.DOI,
			 * "DOI value"); SubstituteJsonValues.substituteJsonValueString(obj,
			 * ClassLabelConstants.PersonFullName, "Edward Blurock");
			 * SubstituteJsonValues.substituteJsonValueString(obj,
			 * ClassLabelConstants.givenName, "Edward");
			 * SubstituteJsonValues.substituteJsonValueString(obj,
			 * ClassLabelConstants.familyName, "Blurock");
			 */
			body.addElement("pre").addText(JsonObjectUtilities.toString(obj));
			Map<String, Object> mapObj = new Gson().fromJson(obj, new TypeToken<HashMap<String, Object>>() {
			}.getType());
			ApiFuture<WriteResult> result = docRef.set(mapObj);
			body.addElement("h3").addText("\nSuccessful write to empty/catalog: " + result.get().getUpdateTime());
		} catch (IOException e) {
			MessageConstructor.combineBodyIntoDocument(document, e.toString());
		} catch (InterruptedException e) {
			MessageConstructor.combineBodyIntoDocument(document, e.toString());
		} catch (ExecutionException e) {
			MessageConstructor.combineBodyIntoDocument(document, e.toString());
		} catch (Exception e) {
			MessageConstructor.combineBodyIntoDocument(document, e.toString());
		}

		response.setContentType("text/html");
		response.setCharacterEncoding("UTF-8");
		PrintWriter out = response.getWriter();
		out.println(MessageConstructor.DocumentToString(document));
	}

}
