package info.blurock.datamanager.service.workflow;

import com.google.gson.JsonObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Discovers and dispatches workflow tasks based on their ontology class names.
 */
@Service
public class WorkflowTaskDispatcher {

    @Autowired(required = false)
    private List<OntologyWorkflowTask> registeredTasks;

    private final Map<String, OntologyWorkflowTask> taskRegistry = new HashMap<>();

    @PostConstruct
    public void init() {
        if (registeredTasks != null) {
            for (OntologyWorkflowTask task : registeredTasks) {
                taskRegistry.put(task.getOntologyClass(), task);
                System.out.println("Registered Workflow Task: " + task.getOntologyClass());
            }
        }
    }

    /**
     * Executes a task by its ontology class name.
     * @param ontologyClass The ontology class name of the task.
     * @param input The JSON input for the task.
     * @return The JSON result.
     * @throws IllegalArgumentException if no task is found for the given class name.
     */
    public JsonObject executeTask(String ontologyClass, JsonObject input) {
        OntologyWorkflowTask task = taskRegistry.get(ontologyClass);
        if (task == null) {
            throw new IllegalArgumentException("No workflow task found for ontology class: " + ontologyClass);
        }
        return task.execute(input);
    }
}
