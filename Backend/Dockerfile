# ===== STAGE 1: Build jar =====
FROM maven:3.9.9-eclipse-temurin-24 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ===== STAGE 2: Run jar =====
FROM openjdk:24-jdk
ARG JAR_FILE=target/*.jar
WORKDIR /app
COPY --from=builder app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]