---
name: Converting a JSON object to a string in the JAVA backend
description: In the JAVA backend, when a JSON object is converted to a string for output, the method `JsonObjectUtilities.toString(json)` should be used. 


# My Skill
The method `JsonObjectUtilities.toString(json)` is a static method in the class,

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;


Do not use `json.toString()` as it will not produce the desired output. 

**Parameters:**
- `json`: The JSON object to convert to a string. This should be a `JsonObject`.

**Returns:**
- A string representation of the JSON object.

**Example:**
```java
JsonObject json = new JsonObject();
json.addProperty("name", "John");
json.addProperty("age", 30);
String jsonString = JsonObjectUtilities.toString(json);
System.out.println(jsonString);
```

Output:
{
    "name": "John",
    "age": 30
}