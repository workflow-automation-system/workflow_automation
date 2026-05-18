# ==========================================
# Étape 1 : Construction (Build)
# ==========================================
# Utilisation de l'image officielle Maven avec Java 17 pour compiler le projet
FROM maven:3.9.4-eclipse-temurin-17 AS build

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier uniquement le fichier pom.xml en premier
# Cela permet de mettre en cache les dépendances Maven (optimisation du temps de build)
COPY pom.xml .

# Télécharger les dépendances (elles seront mises en cache si le pom.xml ne change pas)
RUN mvn dependency:go-offline -B

# Copier tout le code source du projet
COPY src ./src

# Compiler le code et créer le fichier JAR final (en ignorant les tests pour aller plus vite)
RUN mvn clean package -Dmaven.test.skip=true

# ==========================================
# Étape 2 : Exécution (Run)
# ==========================================
# Utilisation d'une image Java 17 légère pour faire tourner l'application
FROM eclipse-temurin:17-jre-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier JAR généré depuis l'étape de construction (build)
# Le nom du fichier généré dépend de votre pom.xml, ici on utilise un joker *.jar
COPY --from=build /app/target/*.jar app.jar

# Exposer le port sur lequel le service écoute (ici 8081 pour auth-service)
EXPOSE 8081

# Commande pour démarrer l'application Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]
