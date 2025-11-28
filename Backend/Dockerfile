# ===== STAGE 1: Build jar (Dùng JDK 21) =====
# Sử dụng JDK 21 để build, khớp với phiên bản runtime
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ===== STAGE 2: Run jar (Dùng JRE 21) =====
# Sử dụng JRE 21 (nhỏ hơn JDK) để chạy ứng dụng
# Dùng eclipse-temurin nhất quán để tránh lỗi pull image openjdk
FROM eclipse-temurin:21-jre
ARG JAR_FILE=target/*.jar
WORKDIR /app

# Copy file jar từ stage 'builder'
COPY --from=builder /app/target/*.jar app.jar

# Expose cổng (Mặc dù đã expose trong docker-compose, đây là best practice)
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]