package info.blurock.datamanager.service.workflow;

import com.google.gson.JsonObject;

/**
 * Standard interface for all small ontology-driven workflow tasks.
 * Each implementation represents a specific task described in the ontology.
 */
public interface OntologyWorkflowTask {
    
    /**
     * @return The canonical ontology class name associated with this task.
     */
    String getOntologyClass();

    /**
     * Executes the task logic.
     * @param input The JSON input parameters for the task.
     * @return The JSON result of the task.
     */
    JsonObject execute(JsonObject input);
}
