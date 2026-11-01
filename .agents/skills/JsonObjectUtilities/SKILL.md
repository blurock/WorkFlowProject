---
name: JsonObjectUtilities
description: In the JAVA backend, when a JSON object is converted to a string for output, the method JsonObjectUtilities.toString(json) should be used.
---

# Converting a JSON Object to a String in the Java Backend

The method `JsonObjectUtilities.toString(json)` is a static method in the class:

```java
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
```

Do not use `json.toString()` as it will not produce the desired formatted output.

**Parameters:**
- `json`: The JSON object to convert to a string. This should be a `JsonObject`.

**Returns:**
- A formatted string representation of the JSON object.

**Example:**
```java
JsonObject json = new JsonObject();
json.addProperty("name", "John");
json.addProperty("age", 30);
String jsonString = JsonObjectUtilities.toString(json);
System.out.println(jsonString);
```

Output:
```json
{
    "name": "John",
    "age": 30
}
```
