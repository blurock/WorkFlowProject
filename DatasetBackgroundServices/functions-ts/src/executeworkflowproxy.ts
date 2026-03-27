import { onCall, HttpsError } from "firebase-functions/v2/https";
import { ExecutionsClient } from "@google-cloud/workflows";

const client = new ExecutionsClient();

export const executeWorkflowCallable = onCall({
    region: 'europe-north2', 
    timeoutSeconds: 540 // Important for the 9-minute wait
}, async (request) => {
    // 1. Authentication Check
    // Firebase automatically populates request.auth if a valid token is sent
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const searchTerm = request.data.searchTerm;
    const project = 'blurock-database';
    const location = 'europe-north2';
    const workflow = 'BasicWorkFlow';

    try {
        // 2. Trigger the Workflow
        const [execution] = await client.createExecution({
            parent: client.workflowPath(project, location, workflow),
            execution: { argument: JSON.stringify({ searchTerm }) }
        });

        const executionName = execution.name!;
        
        // 3. Smart Polling (Wait for result)
        let finished = false;
        let finalResult = null;

        while (!finished) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const [pollResponse] = await client.getExecution({ name: executionName });

            if (pollResponse.state !== 'ACTIVE') {
                finished = true;
                if (pollResponse.state === 'SUCCEEDED') {
                    finalResult = JSON.parse(pollResponse.result!);
                } else {
                    throw new HttpsError("internal", `Workflow failed: ${pollResponse.state}`);
                }
            }
        }

        return { result: finalResult };

    } catch (error: any) {
        throw new HttpsError("internal", error.message);
    }
});

/*
import * as functions from 'firebase-functions';
import { ExecutionsClient } from '@google-cloud/workflows';

const client = new ExecutionsClient();

export const executeWorkflowSmartProxy = functions.https.onRequest(async (req, res) => {
    // CORS Configuration
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const searchTerm = req.body.data?.searchTerm;
        const project = 'blurock-database';
        const location = 'europe-north2';
        const workflow = 'BasicWorkFlow';

        // 1. Trigger the Workflow
        const [execution] = await client.createExecution({
            parent: client.workflowPath(project, location, workflow),
            execution: { argument: JSON.stringify({ searchTerm }) }
        });

        const executionName = execution.name!;
        console.log(`Execution started: ${executionName}`);

        // 2. Internal Polling Logic
        let finished = false;
        let result = null;

        while (!finished) {
            // Wait 2 seconds between polls to avoid API rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));

            const [pollResponse] = await client.getExecution({ name: executionName });

            if (pollResponse.state !== 'ACTIVE') {
                finished = true;
                if (pollResponse.state === 'SUCCEEDED') {
                    // Workflows returns results as a JSON string
                    result = JSON.parse(pollResponse.result!);
                } else {
                    throw new Error(`Workflow failed with state: ${pollResponse.state}`);
                }
            }
        }

        // 3. Return the actual final data to Angular
        res.status(200).send({ data: result });

    } catch (error: any) {
        console.error('Smart Proxy Error:', error);
        res.status(500).send({ data: { error: error.message } });
    }
});
*/