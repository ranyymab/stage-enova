package com.enovarobotics.pguard.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Expose backend/data/images/ as static files under /images/detections/**.
 *
 * DashboardService.buildImageUrl() always builds URLs shaped like
 * "/images/detections/{imageFileName}" (see DashboardService, ~line 561),
 * but until now nothing actually served that path — there was no
 * ResourceHandler registered, so every "Voir" link on the anomalies table
 * pointed at a URL that 404'd.
 *
 * This maps that URL prefix straight onto the flat images folder on disk
 * (./data/images/, relative to the backend's working directory, same
 * app.data-dir the rest of the import pipeline uses), so a detection whose
 * imageFileName is "1.jpg" resolves to backend/data/images/1.jpg.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/detections/**")
                .addResourceLocations("file:./data/images/");
    }
}
