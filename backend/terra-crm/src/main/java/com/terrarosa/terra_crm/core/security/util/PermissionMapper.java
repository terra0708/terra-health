package com.terrarosa.terra_crm.core.security.util;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Utility class for compressing and expanding permission names in JWT tokens.
 * Reduces JWT size by using shorter permission codes.
 * 
 * Mapping examples:
 * - MODULE_DASHBOARD → D:MOD
 * - APPOINTMENTS_VIEW → APT:V
 * - CUSTOMERS_CREATE → CUS:C
 */
public class PermissionMapper {
    
    // Permission type prefixes
    private static final String MODULE_PREFIX = "MODULE_";
    private static final String ACTION_PREFIX = "";
    
    // Action type mappings
    private static final Map<String, String> ACTION_MAP = new HashMap<>();
    static {
        ACTION_MAP.put("VIEW", "V");
        ACTION_MAP.put("CREATE", "C");
        ACTION_MAP.put("UPDATE", "U");
        ACTION_MAP.put("DELETE", "D");
    }
    
    // Reverse action mappings
    private static final Map<String, String> ACTION_REVERSE_MAP = new HashMap<>();
    static {
        ACTION_MAP.forEach((k, v) -> ACTION_REVERSE_MAP.put(v, k));
    }
    
    // Module name abbreviations
    private static final Map<String, String> MODULE_ABBREV = new HashMap<>();
    static {
        MODULE_ABBREV.put("DASHBOARD", "D");
        MODULE_ABBREV.put("APPOINTMENTS", "APT");
        MODULE_ABBREV.put("CUSTOMERS", "CUS");
        MODULE_ABBREV.put("REMINDERS", "REM");
        MODULE_ABBREV.put("STATISTICS", "STAT");
        MODULE_ABBREV.put("NOTIFICATIONS", "NOT");
        MODULE_ABBREV.put("MARKETING", "MKT");
        MODULE_ABBREV.put("SETTINGS", "SET");
    }
    
    // Reverse module abbreviations
    private static final Map<String, String> MODULE_REVERSE_ABBREV = new HashMap<>();
    static {
        MODULE_ABBREV.forEach((k, v) -> MODULE_REVERSE_ABBREV.put(v, k));
    }
    
    /**
     * Compress a list of permission names to shorter codes.
     */
    public static List<String> compressPermissions(List<String> permissions) {
        return permissions.stream()
                .map(PermissionMapper::compressPermission)
                .collect(Collectors.toList());
    }
    
    /**
     * Expand a list of compressed permission codes back to full names.
     */
    public static List<String> expandPermissions(List<String> compressed) {
        return compressed.stream()
                .map(PermissionMapper::expandPermission)
                .collect(Collectors.toList());
    }
    
    /**
     * Compress a single permission name.
     */
    private static String compressPermission(String permission) {
        if (permission == null || permission.isEmpty()) {
            return permission;
        }
        
        // Handle MODULE permissions: MODULE_DASHBOARD -> D:MOD
        if (permission.startsWith(MODULE_PREFIX)) {
            String moduleName = permission.substring(MODULE_PREFIX.length());
            String abbrev = MODULE_ABBREV.getOrDefault(moduleName, moduleName.substring(0, Math.min(3, moduleName.length())).toUpperCase());
            return abbrev + ":MOD";
        }
        
        // Handle ACTION permissions: APPOINTMENTS_VIEW -> APT:V
        String[] parts = permission.split("_");
        if (parts.length >= 2) {
            String modulePart = parts[0];
            String actionPart = parts[parts.length - 1];
            
            String moduleAbbrev = MODULE_ABBREV.getOrDefault(modulePart, 
                modulePart.substring(0, Math.min(3, modulePart.length())).toUpperCase());
            String actionCode = ACTION_MAP.getOrDefault(actionPart, actionPart.substring(0, 1).toUpperCase());
            
            return moduleAbbrev + ":" + actionCode;
        }
        
        // Fallback: return as-is if pattern doesn't match
        return permission;
    }
    
    /**
     * Expand a single compressed permission code.
     */
    private static String expandPermission(String compressed) {
        if (compressed == null || compressed.isEmpty()) {
            return compressed;
        }
        
        // Check if it's already in full format (no colon)
        if (!compressed.contains(":")) {
            return compressed;
        }
        
        String[] parts = compressed.split(":");
        if (parts.length != 2) {
            return compressed; // Invalid format, return as-is
        }
        
        String prefix = parts[0];
        String suffix = parts[1];
        
        // Handle MODULE: MOD -> MODULE_DASHBOARD
        if ("MOD".equals(suffix)) {
            String moduleName = MODULE_REVERSE_ABBREV.getOrDefault(prefix, prefix);
            return MODULE_PREFIX + moduleName;
        }
        
        // Handle ACTION: APT:V -> APPOINTMENTS_VIEW
        String moduleName = MODULE_REVERSE_ABBREV.getOrDefault(prefix, prefix);
        String actionName = ACTION_REVERSE_MAP.getOrDefault(suffix, suffix);
        return moduleName + "_" + actionName;
    }
}
