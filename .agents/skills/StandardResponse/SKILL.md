---
name: StandardResponse
description: Every response from the backend should be a StandardResponse object.
---

# StandardResponse

The standard response has the form:
"dataset:servicesuccessful": "true" if the service call was successful or "false" if it was not successful.
"dataset:serviceresponsemessage": "The response message from the service call. This is a org.dom4j.Document converted to a string"
"dataset:simplecatalogobject": This is an array of catalog objects that were returned by the service or transaction call.

*** org.dom4j.Document. ***
The org.dom4j.Document is meant to be documentation of the service process. It should be human readable and understandable. It is an html object that can be displayed by the GUI.
In typescript, this is a SafeHtml object.
if (this.responseMessage) {
    this.sanitizedMessage = this.sanitizer.bypassSecurityTrustHtml(this.responseMessage);
}

*** MessageConstructor ***
info.esblurock.reaction.core.MessageConstructor;
The MessageConstructor class is used to create and manipulate the org.dom4j.Document. 
The org.dom4j.Document is created with: Document docmessage = MessageConstructor.startDocument("Title with respect to service");
The body of the document is found with:
Element body = MessageConstructor.isolateBody(docmessage);

To add a new element to the body (for example):
Element newelement = body.addElement("elementname");
newelement.addText("elementtext");

The document is converted to a string with: 
MessageConstructor.DocumentToString(document)

*** StandardResponse ***
info.esblurock.reaction.core.StandardResponse;
The StandardResponse class is used to create the StandardResponse object.
When the service succeeds:
public static JsonObject standardServiceResponse(Document document, String response, JsonElement result)
StandardResponse.standardServiceResponse(document, "Message to cause of success", jsonarray);
When the service fails:
public static JsonObject standardErrorResponse(Document document, String errresponse, JsonElement result)
StandardResponse.standardErrorResponse(document, "Message to cause of failure", null);
or 
public static JsonObject standardErrorResponse(Document document, JsonObject errresponse, JsonElement result)

The answer (in dataset:simplecatalogobject), by convention,  should be a JsonArray of JsonObjects.


## When to use this skill

- At every service call and transaction.
- Every endpoint service should return a StandardResponse object.

## How to use it

1. Create a document with a title:
Document docmessage = MessageConstructor.startDocument("Title with respect to service");
2. Isolate the body of the document:
Element body = MessageConstructor.isolateBody(docmessage);
3. Add information to the body of the document:
4. If another service is called, the documents can be merged:
public static void combineBodyIntoDocument(Document first, Document second)
or if the second document is in string form:
public static void combineBodyIntoDocument(Document first, String second)
5. Create response object:
if successful:
public static JsonObject standardServiceResponse(Document document, String response, JsonElement result)
or if an error:
public static JsonObject standardErrorResponse(Document document, String errresponse, JsonElement result)
or 
public static JsonObject standardErrorResponse(Document document, JsonObject errresponse, JsonElement result)
