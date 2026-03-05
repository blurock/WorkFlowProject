package info.blurock.workflow.dto;

public class ChatResponse {
    private String bestMatch;

    public ChatResponse(String bestMatch) {
        this.bestMatch = bestMatch;
    }

    public String getBestMatch() {
        return bestMatch;
    }

    public void setBestMatch(String bestMatch) {
        this.bestMatch = bestMatch;
    }
}
