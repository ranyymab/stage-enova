FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN apk add --no-cache maven
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/data ./data
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
