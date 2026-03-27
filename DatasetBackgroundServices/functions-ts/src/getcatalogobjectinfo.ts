import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { OAuth2Client } from "google-auth-library";
import * as logger from 'firebase-functions/logger';

const javaBackendUrl = defineString('JAVA_BACKEND_URL', { default: 'http://localhost:8080' });
const runFunctionUrl = defineString('RUN_FUNCTION_URL', { default: 'http://localhost:5001' });
const client = new OAuth2Client();

export const getCatalogObjectInfo = onRequest(async (req, res): Promise<void> => {
	logger.info("Received request for getCatalogObjectInfo", { detail: "extra info" });
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).send("Unauthorized: Missing Token");
    return; // Returns void
  }

  logger.info("verifying token for getCatalogObjectInfo", { detail: "extra info" });

  try {
    const idToken = authHeader.split("Bearer ")[1];
    await client.verifyIdToken({
      idToken: idToken,
	  audience: runFunctionUrl.value(),
    });
	logger.info("after verifying token for getCatalogObjectInfo", { detail: "extra info" });

    const catalogName = req.body.catalogname || req.query.catalogname;
	logger.info("getCatalogObjectInfo: catalogname" + catalogName, { detail: "extra info" });

	    if (!catalogName) {
      res.status(400).send("Bad Request: Missing catalogname");
      return; // Returns void
    }

	const targetUrl = `${javaBackendUrl.value()}/cataloginfo?catalogname=${encodeURIComponent(catalogName)}`;
	logger.info(`Fetching catalog info from: ${targetUrl}`, { detail: "extra info" });
    const backendResponse = await fetch(targetUrl);
    logger.info(`Received response from backend with status: ${backendResponse.status}`);
    if (!backendResponse.ok) {
      res.status(backendResponse.status).send("Backend Error");
      return; // Returns void
    }

    const data = await backendResponse.json();

    res.status(200).send({
      status: "success",
      payload: data
    });
    return; // Explicitly return void to satisfy TS7030

  } catch (error: any) {
    console.error("Function Error:", error.message);
    res.status(500).send({
      error: "Internal Server Error",
      details: error.message
    });
    return; // Explicitly return void
  }
});