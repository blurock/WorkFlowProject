package info.esblurock.background.services.service;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Base64;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.dom4j.Document;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@WebServlet(name = "BackgroundTransaction", urlPatterns = { "/transaction" })
public class BackgroundTransaction extends HttpServlet {
    private static final long serialVersionUID = 1L;

    /**
     * POST The input is one JSON argument (read in using InputStream). The argument
     * 'service' determines which service is to be performed
     * {@link DatabaseServicesBase} processes the data with the service.
     * 
     * The response is application/json
     *
     */
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
       InitiallizeSystem.initialize();
       String bodyS = IOUtils.toString(request.getInputStream(), "UTF-8");

        String authHeader = request.getHeader("authorization");
        String idToken = authHeader.split(" ")[1];
        FirebaseToken decodedToken;
        JsonObject answer = null;
        try {
            decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();

            JsonObject body = JsonObjectUtilities.jsonObjectFromString(bodyS);
            String uidfrombody = body.get("uid").getAsString();
            if (uidfrombody.equals(uid)) {
                answer = TransactionProcess.processFromTransaction(body, uid);
            } else {
                Document document = MessageConstructor.startDocument("Transaction fatal error UID mismatch");
                answer = StandardResponse.standardErrorResponse(null, "UIDs illegal token, user not signed in",
                        null);
            }
        } catch (FirebaseAuthException e) {
            Document document = MessageConstructor.startDocument("Transaction fatal error");
            answer = StandardResponse.standardErrorResponse(document, "Firebase error: " + e.getMessage(), null);
            e.printStackTrace();
        } catch (Exception e) {
            Document document = MessageConstructor.startDocument("General fatal error");
            answer = StandardResponse.standardErrorResponse(document, "Error: " + e.getMessage(), null);
            e.printStackTrace();
        }

        PrintWriter out = response.getWriter();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        out.print(JsonObjectUtilities.toString(answer));
        out.flush();

    }
}
