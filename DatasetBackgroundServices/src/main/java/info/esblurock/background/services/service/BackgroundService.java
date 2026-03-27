package info.esblurock.background.services.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;

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
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@WebServlet(name = "BackgroundService", urlPatterns = { "/service" })
public class BackgroundService extends HttpServlet {

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

        // Not sure about 'name of header'
        // From const headers = new Headers({'Authorization': 'Bearer ' + authToken });
        // In
        /*
         * try { boolean sucess = request.authenticate(response); } catch (IOException |
         * ServletException e) { // TODO Auto-generated catch block e.printStackTrace();
         * }
         */
        InitiallizeSystem.initialize();
        String bodyS = IOUtils.toString(request.getInputStream(), "UTF-8");
        JsonObject body = JsonObjectUtilities.jsonObjectFromString(bodyS);
        String uidfrombody = body.get("uid").getAsString();

        String authHeader = request.getHeader("authorization");
        String idToken = authHeader.split(" ")[1];

        FirebaseToken decodedToken;

        JsonObject answer = null;
        try {
            String uid = null;
            if (!idToken.equals("null")) {
                decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                uid = decodedToken.getUid();
                if (uidfrombody.equals(uid)) {
                    answer = DatabaseServicesBase.process(body);
                } else {
                    Document document = MessageConstructor.startDocument("Service fatal error UID mismatch");
                    answer = StandardResponse.standardErrorResponse(document, "UIDs illegal token, user not signed in",
                            null);
                }
            } else {
                if (uidfrombody.equals("Guest")) {
                    
                    answer = DatabaseServicesBase.process(body);
                } else {
                    Document document = MessageConstructor.startDocument("Service fatal error Guest login");
                    answer = StandardResponse.standardErrorResponse(document, "Illegal Guest process", null);
                }
            }

        } catch (FirebaseAuthException e) {
            Document document = MessageConstructor.startDocument("Service fatal error");
            answer = StandardResponse.standardErrorResponse(document, "Firebase error: " + e.getMessage(), null);
            e.printStackTrace();
        }

        PrintWriter out = response.getWriter();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        out.print(JsonObjectUtilities.toString(answer));
        out.flush();
    }

    /**
     * Read in the JSON data from the body of the post
     * 
     * @param request The request from the POST
     * @return The JsonObject data as a string
     * @throws IOException
     */
    public static String getBody(HttpServletRequest request) throws IOException {

        String body = null;
        StringBuilder stringBuilder = new StringBuilder();
        BufferedReader bufferedReader = null;

        try {
            InputStream inputStream = request.getInputStream();
            if (inputStream != null) {
                bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
                char[] charBuffer = new char[128];
                int bytesRead = -1;
                while ((bytesRead = bufferedReader.read(charBuffer)) > 0) {
                    stringBuilder.append(charBuffer, 0, bytesRead);
                }
            } else {
                stringBuilder.append("");
            }
        } catch (IOException ex) {
            throw ex;
        }
        if (bufferedReader != null) {
            try {
                bufferedReader.close();
            } catch (IOException ex) {
                throw ex;
            }
        }

        body = stringBuilder.toString();
        return body;
    }

}
