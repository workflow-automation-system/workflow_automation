# ==========================================
# Build stage
# ==========================================
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy sources and build
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Run stage
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# audit-service listens on 8085 by default (application.yml)
EXPOSE 8085

ENTRYPOINT ["java","-jar","app.jar"]
