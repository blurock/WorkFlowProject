/*
import * as functions from "firebase-functions";

export const helloWorld = functions.https.onRequest((request, response) => {
   functions.logger.info("Hello logs!", {structuredData: true});
   response.send("Hello from Firebase!");
 });
*/

import { initializeApp } from "firebase-admin/app";
initializeApp(); // Best practice to have this at the top

export { runTransaction } from "./runtransaction";
export { getCatalogObjectInfo } from "./getcatalogobjectinfo";
export {executeWorkflowCallable} from "./executeworkflowproxy"
//export { getUser, updateProfile } from "./userLogic";