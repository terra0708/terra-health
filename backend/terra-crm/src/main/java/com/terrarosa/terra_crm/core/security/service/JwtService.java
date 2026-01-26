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
    private Long expiration; // Access token expiration (15 minutes)
    
    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration; // Refresh token expiration (7 days)
    
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
     * Generate access token for a user.
     * Short-lived token (15 minutes) containing all authorization information.
     * Permissions are compressed to reduce JWT size.
     * 
     * @param email User email
     * @param tenantId Tenant ID
     * @param schemaName Schema name
     * @param roles User roles
     * @param permissions User permissions
     * @return Access token string
     */
    public String generateAccessToken(String email, String tenantId, String schemaName, List<String> roles, List<String> permissions) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration); // 15 minutes
        
        // Compress permissions to reduce JWT size
        List<String> compressedPermissions = PermissionMapper.compressPermissions(permissions);
        
        return Jwts.builder()
                .subject(email)
                .claim("tenantId", tenantId)
                .claim("schema_name", schemaName)
                .claim("roles", roles)
                .claim("permissions", compressedPermissions)
                .claim("type", "access") // Token type claim
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * Generate refresh token for a user.
     * Long-lived token (7 days) containing only user identity and token ID.
     * Token ID is used for token rotation - when refresh token is used, it's invalidated.
     * 
     * @param email User email
     * @param tokenId Unique token ID (UUID) for token rotation
     * @return Refresh token string
     */
    public String generateRefreshToken(String email, String tokenId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration); // 7 days
        
        return Jwts.builder()
                .subject(email)
                .claim("tokenId", tokenId) // Token ID for rotation
                .claim("type", "refresh") // Token type claim
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * Extract token ID from refresh token.
     * Used for token rotation validation.
     */
    public String extractTokenId(String token) {
        return extractClaim(token, claims -> claims.get("tokenId", String.class));
    }
    
    /**
     * Extract token type from token.
     */
    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("type", String.class));
    }
    
    /**
     * Validate refresh token.
     * Checks if token is valid, not expired, and is a refresh token type.
     * 
     * @param token Refresh token string
     * @return true if token is valid refresh token, false otherwise
     */
    public boolean validateRefreshToken(String token) {
        try {
            if (!validateToken(token)) {
                return false;
            }
            
            // Check if token is expired
            if (isTokenExpired(token)) {
                log.warn("Refresh token is expired");
                return false;
            }
            
            // Check if token type is "refresh"
            String tokenType = extractTokenType(token);
            if (tokenType == null || !"refresh".equals(tokenType)) {
                log.warn("Token is not a refresh token. Type: {}", tokenType);
                return false;
            }
            
            return true;
        } catch (Exception e) {
            log.error("Failed to validate refresh token: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Generate JWT token for a user.
     * DEPRECATED: Use generateAccessToken instead.
     * Kept for backward compatibility.
     */
    @Deprecated
    public String generateToken(String email, String tenantId, String schemaName, List<String> roles, List<String> permissions) {
        return generateAccessToken(email, tenantId, schemaName, roles, permissions);
    }
    
    /**
     * Generate JWT token for a user (backward compatibility - without permissions).
     * DEPRECATED: Use generateAccessToken instead.
     */
    @Deprecated
    public String generateToken(String email, String tenantId, String schemaName, List<String> roles) {
        return generateAccessToken(email, tenantId, schemaName, roles, List.of());
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
