package esblurock.info.neo4j.utilities;

import org.neo4j.driver.AuthToken;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;

import com.google.cloud.secretmanager.v1.AccessSecretVersionResponse;
import com.google.cloud.secretmanager.v1.SecretManagerServiceClient;
import com.google.cloud.secretmanager.v1.SecretVersionName;

public class Neo4JInitialization {
	public static Driver driver = null;

	// tag::initDriver[]
	public static Driver getDriver() throws Exception {
		AuthToken auth = AuthTokens.basic(getNeo4jUsername(), getNeo4jPassword());
		if (Neo4JInitialization.driver == null) {
			Neo4JInitialization.driver = GraphDatabase.driver(getNeo4jUri(), auth);
		}

		Neo4JInitialization.driver.verifyConnectivity();

		return Neo4JInitialization.driver;
	}

	static int getServerPort() {
		return Integer.parseInt(System.getProperty("APP_PORT", "3000"));
	}

	static String getJwtSecret() {
		return System.getenv("JWT_SECRET");
	}

	static String getNeo4jUri() {
		String uri = System.getenv("NEO4J_URI");
		if (uri == null || uri.isEmpty()) {
			try (SecretManagerServiceClient client = SecretManagerServiceClient.create()) {
				SecretVersionName name = SecretVersionName.of("blurock-database", "Neo4jUri", "latest");
				AccessSecretVersionResponse response = client.accessSecretVersion(name);
				uri = response.getPayload().getData().toStringUtf8();
			} catch (Exception e) {
				System.err.println("Error fetching secret Neo4jUri: " + e.getMessage());
			}
		}
		return uri;
	}

	static String getNeo4jUsername() {
		String username = System.getenv("NEO4J_USERNAME");
		if (username == null || username.isEmpty()) {
			try (SecretManagerServiceClient client = SecretManagerServiceClient.create()) {
				SecretVersionName name = SecretVersionName.of("blurock-database", "Neo4jUsername", "latest");
				AccessSecretVersionResponse response = client.accessSecretVersion(name);
				username = response.getPayload().getData().toStringUtf8();
			} catch (Exception e) {
				System.err.println("Error fetching secret Neo4jUsername: " + e.getMessage());
			}
		}
		return username;
	}

	static String getNeo4jPassword() {
		String password = System.getenv("NEO4J_PASSWORD");
		if (password == null || password.isEmpty()) {
			try (SecretManagerServiceClient client = SecretManagerServiceClient.create()) {
				// Project ID is blurock-database
				SecretVersionName name = SecretVersionName.of("blurock-database", "Neo4jPassword", "latest");
				AccessSecretVersionResponse response = client.accessSecretVersion(name);
				password = response.getPayload().getData().toStringUtf8();
			} catch (Exception e) {
				System.err.println("Error fetching secret Neo4jPassword: " + e.getMessage());
			}
		}
		return password;
	}

}
