package info.blurock.datamanager.controller;

import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.google.gson.JsonObject;
import org.dom4j.Document;

import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    @GetMapping("/test")
    public String test() {
        return "Storage API is reachable";
    }

    @PostMapping(value = "/upload-file", consumes = "multipart/form-data", produces = "application/json")
    public String uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("uid") String uid) {
        System.out.println("Received file upload request: uid=" + uid + ", filename=" + file.getOriginalFilename());
        try {
            Document doc = MessageConstructor.startDocument("FileUpload");
            String filename = file.getOriginalFilename();
            String path = "upload/" + uid + "/" + filename;

            Bucket bucket = StorageClient.getInstance().bucket();
            bucket.create(path, file.getBytes(), file.getContentType());

            JsonObject result = new JsonObject();
            result.addProperty("path", path);
            result.addProperty("filename", filename);
            result.addProperty("url", String.format("https://storage.googleapis.com/%s/%s", bucket.getName(), path));

            return StandardResponse.standardServiceResponse(doc, "File uploaded successfully", result).toString();
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse("Upload failed: " + e.getMessage());
        }
    }

    @PostMapping(value = "/upload-text", produces = "application/json")
    public String uploadText(@RequestBody Map<String, String> params) {
        String uid = params.get("uid");
        String filename = params.get("filename");
        System.out.println("Received text upload request: uid=" + uid + ", filename=" + filename);
        try {
            Document doc = MessageConstructor.startDocument("TextUpload");
            String content = params.get("content");
            String path = "upload/" + uid + "/" + filename;

            Bucket bucket = StorageClient.getInstance().bucket();
            bucket.create(path, content.getBytes(StandardCharsets.UTF_8), "text/plain");

            JsonObject result = new JsonObject();
            result.addProperty("path", path);
            result.addProperty("filename", filename);

            return StandardResponse.standardServiceResponse(doc, "Text content uploaded successfully", result).toString();
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse("Text upload failed: " + e.getMessage());
        }
    }

    @PostMapping(value = "/upload-url", produces = "application/json")
    public String uploadUrl(@RequestBody Map<String, String> params) {
        String uid = params.get("uid");
        String sourceUrl = params.get("url");
        System.out.println("Received URL upload request: uid=" + uid + ", url=" + sourceUrl);
        try {
            Document doc = MessageConstructor.startDocument("UrlUpload");
            
            // Extract filename from URL
            String filename = sourceUrl.substring(sourceUrl.lastIndexOf('/') + 1);
            if (filename.contains("?")) {
                filename = filename.substring(0, filename.indexOf("?"));
            }
            if (filename.isEmpty()) {
                filename = "resource_" + System.currentTimeMillis();
            }
            
            String path = "upload/" + uid + "/" + filename;

            // Fetch content from URL
            URL url = new URL(sourceUrl);
            try (InputStream in = url.openStream()) {
                byte[] content = in.readAllBytes();
                Bucket bucket = StorageClient.getInstance().bucket();
                bucket.create(path, content);
            }

            JsonObject result = new JsonObject();
            result.addProperty("path", path);
            result.addProperty("filename", filename);

            return StandardResponse.standardServiceResponse(doc, "URL resource uploaded successfully", result).toString();
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse("URL upload failed: " + e.getMessage());
        }
    }

    private String createErrorResponse(String message) {
        JsonObject errorResponse = new JsonObject();
        errorResponse.addProperty("dataset:servicesuccessful", "false");
        errorResponse.addProperty("dataset:serviceresponsemessage", message);
        return errorResponse.toString();
    }
}
