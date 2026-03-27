import { onRequest } from "firebase-functions/v2/https";
import { OAuth2Client } from "google-auth-library";

// The Audience is the URL of your Cloud Function
const client = new OAuth2Client();
const FUNCTION_URL = process.env.RUN_TRANSACTION_URL || "";

export const runTransaction = onRequest(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).send("Unauthorized: Missing Token");
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    // 1. Verify the OIDC Token
    // In production, this checks the signature and expiration
    let callerEmail = "emulator-user";
    
    if (!process.env.FUNCTIONS_EMULATOR) {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: FUNCTION_URL,
      });
      const payload = ticket.getPayload();
      callerEmail = payload?.email || "unknown";
    }

    console.log(`Verified request from: ${callerEmail}`);

    // 2. Extract Data
    const { uid, ...transactionData } = req.body;

    // 3. Process the transaction
    // You now have the 'uid' (End User) and 'callerEmail' (Service Account)
    console.log(`Processing transaction for End User: ${uid}`);

    res.status(200).send({
      status: "success",
      processedBy: callerEmail,
      data: transactionData
    });

  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(403).send("Forbidden: Invalid Token");
  }
});