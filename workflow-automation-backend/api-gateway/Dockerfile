# ==========================================
# Étape 1 : Construction (Build)
# ==========================================
# Image Maven pour builder le projet
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app

# Mise en cache des dépendances
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copie du code et compilation
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true

# ==========================================
# Étape 2 : Exécution (Run)
# ==========================================
# Image plus légère avec uniquement le JRE (Java Runtime Environment)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Récupération du .jar final depuis l'étape de build
COPY --from=build /app/target/*.jar app.jar

# Exposer le port 8085 pour l'API Gateway
EXPOSE 8085

# Démarrer le service
ENTRYPOINT ["java", "-jar", "app.jar"]