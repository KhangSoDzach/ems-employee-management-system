# Multi-stage Dockerfile for Spring Boot Backend
# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Ensure CA certificates are available so Maven can download plugins over HTTPS
RUN apk add --no-cache ca-certificates && update-ca-certificates

# Copy Maven files for dependency caching
COPY pom.xml .
COPY src ./src

# Build the application (skip tests for faster builds)
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001 -G spring

WORKDIR /app

# Create directories that the app needs at runtime
RUN mkdir -p /app/uploads /app/logs && chown -R spring:spring /app/uploads /app/logs

# Copy the built JAR from build stage
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

# Switch to non-root user
USER spring:spring

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD sh -c "wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/actuator/health || exit 1"

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
