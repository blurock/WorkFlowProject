package info.esblurock.background.services.ontology;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.logging.Logger;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.dom4j.Document;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@WebServlet(name = "CatalogHierarchyServlet", urlPatterns = { "/cataloghierarchy" })
public class CatalogHierarchyServlet extends HttpServlet {

	private static final Logger logger = Logger.getLogger(CatalogHierarchyServlet.class.getName());
	private static final long serialVersionUID = 1L;

	@Override
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		String jsonString = request.getParameter("json");
		if (jsonString != null) {
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonString);
			generateResponse(json, response);
		} else {
			response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing json parameter in GET request");
		}
	}

	@Override
	public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
		JsonObject json = JsonObjectUtilities.jsonObjectFromReader(request.getReader());
		generateResponse(json, response);
	}

	private void generateResponse(JsonObject json, HttpServletResponse response) throws IOException {
		JsonObject firestoreID = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(json);
		String path = null;
		if (firestoreID != null) {
			path = CreateHierarchyElement.getPathFromFirestoreID(firestoreID);
		}

		Document document = MessageConstructor.startDocument("DatasetCollectionDocumentIDPairForHierarchy");
		JsonObject data = new JsonObject();
		data.addProperty("path", path);

		JsonObject serveresponse = StandardResponse.standardServiceResponse(document,
				"Success: Firestore path generated", data);

		PrintWriter out = response.getWriter();
		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");
		out.print(JsonObjectUtilities.toString(serveresponse));
		out.flush();
	}

}
