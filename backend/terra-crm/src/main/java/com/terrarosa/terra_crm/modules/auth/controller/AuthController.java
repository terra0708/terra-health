package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.auth.dto.LoginRequest;
import com.terrarosa.terra_crm.modules.auth.dto.LoginResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RegisterRequest;
import com.terrarosa.terra_crm.modules.auth.dto.UserDto;
import com.terrarosa.terra_crm.modules.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private static final String TENANT_HEADER = "X-Tenant-ID";
    
    private final AuthService authService;
    
    /**
     * Login endpoint.
     * Public endpoint - no authentication required.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        // Get tenant ID from header
        String tenantId = httpRequest.getHeader(TENANT_HEADER);
        
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("BAD_REQUEST", "X-Tenant-ID header is required"));
        }
        
        LoginResponse response = authService.login(request, tenantId);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }
    
    /**
     * Register endpoint.
     * DEPRECATED: Public registration is disabled. Use Super Admin endpoint to create tenants.
     * This endpoint is kept for backward compatibility but returns an error.
     */
    @PostMapping("/register")
    @Deprecated
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("FORBIDDEN", 
                    "Public registration is disabled. Please contact Super Admin to create your tenant."));
    }
}
