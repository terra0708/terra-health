package com.terrarosa.terra_crm.core.config;

import com.terrarosa.terra_crm.core.tenancy.TenantInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web configuration for registering interceptors.
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
    
    private final TenantInterceptor tenantInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // CRITICAL: Interceptor only works for auth endpoints (login, register)
        // JWT-authenticated requests use JwtAuthenticationFilter for tenant context
        registry.addInterceptor(tenantInterceptor)
                .addPathPatterns("/api/v1/auth/**");
    }
}
