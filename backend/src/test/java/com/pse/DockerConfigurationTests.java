package com.pse;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.ResourcePropertySource;
import org.springframework.mock.env.MockEnvironment;

class DockerConfigurationTests {

	@Test
	void applicationPropertiesProvideLocalDatasourceDefaults() throws IOException {
		MockEnvironment environment = environmentWithApplicationProperties();

		assertEquals(
				"jdbc:postgresql://localhost:5432/postgres",
				environment.getProperty("spring.datasource.url"));
		assertEquals("postgres", environment.getProperty("spring.datasource.username"));
		assertEquals("", environment.getProperty("spring.datasource.password"));
	}

	@Test
	void applicationPropertiesAllowDockerComposeDatasourceOverrides() throws IOException {
		MockEnvironment environment = environmentWithApplicationProperties();
		environment.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://postgres:5432/postgres");
		environment.setProperty("SPRING_DATASOURCE_USERNAME", "docker_user");
		environment.setProperty("SPRING_DATASOURCE_PASSWORD", "docker_password");

		assertEquals(
				"jdbc:postgresql://postgres:5432/postgres",
				environment.getProperty("spring.datasource.url"));
		assertEquals("docker_user", environment.getProperty("spring.datasource.username"));
		assertEquals("docker_password", environment.getProperty("spring.datasource.password"));
	}

	private MockEnvironment environmentWithApplicationProperties() throws IOException {
		MockEnvironment environment = new MockEnvironment();
		environment.getPropertySources().addLast(new ResourcePropertySource(
				"applicationProperties",
				new ClassPathResource("application.properties")));
		return environment;
	}
}
