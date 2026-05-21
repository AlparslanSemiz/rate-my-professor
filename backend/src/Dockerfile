# ─────────────────────────────
# 1. BUILD STAGE
# ─────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# copy only backend project
COPY backend /app

# download dependencies + build jar
RUN mvn clean package -DskipTests


# ─────────────────────────────
# 2. RUNTIME STAGE
# ─────────────────────────────
FROM eclipse-temurin:21-jdk

WORKDIR /app

# copy ONLY the built jar (no Maven, no source code)
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]