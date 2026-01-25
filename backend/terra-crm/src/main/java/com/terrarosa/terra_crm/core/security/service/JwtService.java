package com.terrarosa.terra_crm.core.security.service;

import com.terrarosa.terra_crm.core.security.util.PermissionMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

/**
 * Service for JWT token generation and validation.
 * Uses JJWT 0.13.0 with modern API.
 */
@Slf4j
@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secretKey;
    
    @Value("${jwt.expiration}")
    private Long expiration;
    
    /**
     * Validate secret key on bean initialization.
     * This ensures the application fails fast if the secret key is invalid.
     */
    @PostConstruct
    public void validateSecretKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("JWT secret key is not configured. Set jwt.secret in application.yaml or JWT_SECRET environment variable.");
        }
        // Try to get signing key to validate it
        getSigningKey();
        log.info("JWT secret key validated successfully");
    }
    
    /**
     * Get the signing key from the secret.
     * Validates that the key is at least 32 bytes (256 bits) for HS256.
     */
    private SecretKey getSigningKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            if (keyBytes.length < 32) {
                throw new IllegalArgumentException(
                    String.format("JWT secret key must be at least 32 bytes (256 bits) for HS256. Current length: %d bytes", keyBytes.length)
                );
            }
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid JWT secret key. Key must be base64 encoded and at least 32 bytes long.", e);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decode JWT secret key. Ensure it is base64 encoded.", e);
        }
    }
    
    /**
     * Generate JWT token for a user.
     * Permissions are compressed to reduce JWT size.
     */
    public String generateToken(String email, String tenantId, String schemaName, List<String> roles, List<String> permissions) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        // Compress permissions to reduce JWT size
        List<String> compressedPermissions = PermissionMapper.compressPermissions(permissions);
        
        return Jwts.builder()
                .subject(email)
                .claim("tenantId", tenantId)
                .claim("schema_name", schemaName)
                .claim("roles", roles)
                .claim("permissions", compressedPermissions)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * Generate JWT token for a user (backward compatibility - without permissions).
     */
    public String generateToken(String email, String tenantId, String schemaName, List<String> roles) {
        return generateToken(email, tenantId, schemaName, roles, List.of());
    }
    
    /**
     * Validate JWT token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Extract all claims from token.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * Extract a specific claim from token.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Extract email (subject) from token.
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * Extract tenant ID from token.
     */
    public String extractTenantId(String token) {
        return extractClaim(token, claims -> claims.get("tenantId", String.class));
    }
    
    /**
     * Extract schema name from token.
     */
    public String extractSchemaName(String token) {
        return extractClaim(token, claims -> claims.get("schema_name", String.class));
    }
    
    /**
     * Extract roles from token.
     */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return extractClaim(token, claims -> claims.get("roles", List.class));
    }
    
    /**
     * Extract permissions from token.
     * Permissions are expanded from compressed format back to full names.
     */
    @SuppressWarnings("unchecked")
    public List<String> extractPermissions(String token) {
        List<String> compressed = extractClaim(token, claims -> claims.get("permissions", List.class));
        if (compressed == null || compressed.isEmpty()) {
            return List.of();
        }
        // Expand compressed permissions back to full names
        return PermissionMapper.expandPermissions(compressed);
    }
    
    /**
     * Check if token is expired.
     */
    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
