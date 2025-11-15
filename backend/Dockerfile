# Build stage
FROM gradle:8.10.2-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy the jar file (use wildcard to match any version)
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Run with production profile
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
