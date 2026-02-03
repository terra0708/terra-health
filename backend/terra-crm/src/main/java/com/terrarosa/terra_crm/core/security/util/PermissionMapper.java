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
 * - APPOINTMENTS_VIEW → APT:V (2-part)
 * - SETTINGS_USERS_VIEW → SET:USR:V (3-part)
 * - CUSTOMERS_CREATE → CUS:C
 */
public class PermissionMapper {

    // Permission type prefixes
    private static final String MODULE_PREFIX = "MODULE_";

    // Action type mappings
    private static final Map<String, String> ACTION_MAP = new HashMap<>();
    static {
        ACTION_MAP.put("VIEW", "V");
        ACTION_MAP.put("CREATE", "C");
        ACTION_MAP.put("UPDATE", "U");
        ACTION_MAP.put("DELETE", "D");
        ACTION_MAP.put("EDIT", "E");
        ACTION_MAP.put("MANAGE", "M");
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
        MODULE_ABBREV.put("HEALTH", "HEA");
        MODULE_ABBREV.put("SUPERADMIN", "SUP");
    }

    // Reverse module abbreviations
    private static final Map<String, String> MODULE_REVERSE_ABBREV = new HashMap<>();
    static {
        MODULE_ABBREV.forEach((k, v) -> MODULE_REVERSE_ABBREV.put(v, k));
    }

    // Submodule name abbreviations (for 3-part permissions)
    private static final Map<String, String> SUBMODULE_ABBREV = new HashMap<>();
    static {
        SUBMODULE_ABBREV.put("USERS", "USR");
        SUBMODULE_ABBREV.put("TENANTS", "TEN");
        SUBMODULE_ABBREV.put("ROLES", "ROL");
        SUBMODULE_ABBREV.put("SCHEMAPOOL", "SCH");
        SUBMODULE_ABBREV.put("CUSTOMER_PANEL", "CPN");
        SUBMODULE_ABBREV.put("SYSTEM", "SYS");
        SUBMODULE_ABBREV.put("CUSTOMERS", "CUS");
        SUBMODULE_ABBREV.put("CAMPAIGNS", "CAM");
        SUBMODULE_ABBREV.put("ATTRIBUTION", "ATT");
        SUBMODULE_ABBREV.put("DASHBOARD", "DSH");
    }

    // Reverse submodule abbreviations
    private static final Map<String, String> SUBMODULE_REVERSE_ABBREV = new HashMap<>();
    static {
        SUBMODULE_ABBREV.forEach((k, v) -> SUBMODULE_REVERSE_ABBREV.put(v, k));
    }

    /**
     * Compress a list of permission names to shorter codes.
     * Returns empty list if input is null or empty.
     */
    public static List<String> compressPermissions(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            return List.of();
        }
        return permissions.stream()
                .filter(p -> p != null && !p.isEmpty())
                .map(PermissionMapper::compressPermission)
                .collect(Collectors.toList());
    }

    /**
     * Expand a list of compressed permission codes back to full names.
     * Returns empty list if input is null or empty.
     */
    public static List<String> expandPermissions(List<String> compressed) {
        if (compressed == null || compressed.isEmpty()) {
            return List.of();
        }
        return compressed.stream()
                .filter(c -> c != null && !c.isEmpty())
                .map(PermissionMapper::expandPermission)
                .collect(Collectors.toList());
    }

    /**
     * Compress a single permission name.
     * Supports both 2-part (APPOINTMENTS_VIEW) and 3-part (SETTINGS_USERS_VIEW)
     * permissions.
     */
    /**
     * Compress a single permission name.
     * Supports both 2-part (APPOINTMENTS_VIEW) and 3-part (SETTINGS_USERS_VIEW)
     * permissions.
     */
    private static String compressPermission(String permission) {
        if (permission == null || permission.isEmpty()) {
            return permission;
        }

        // Handle MODULE permissions: MODULE_DASHBOARD -> D:MOD
        if (permission.startsWith(MODULE_PREFIX)) {
            String moduleName = permission.substring(MODULE_PREFIX.length());
            String abbrev = MODULE_ABBREV.getOrDefault(moduleName,
                    moduleName.substring(0, Math.min(3, moduleName.length())).toUpperCase());
            return abbrev + ":MOD";
        }

        // CRITICAL: Check part count to determine parsing strategy
        String[] parts = permission.split("_");

        // Handle 3-part permissions: SETTINGS_USERS_VIEW -> SET:USR:V
        if (parts.length == 3) {
            String modulePart = parts[0]; // "SETTINGS"
            String submodulePart = parts[1]; // "USERS"
            String actionPart = parts[2]; // "VIEW"

            String moduleAbbrev = MODULE_ABBREV.getOrDefault(modulePart,
                    modulePart.substring(0, Math.min(3, modulePart.length())).toUpperCase());
            String submoduleAbbrev = SUBMODULE_ABBREV.getOrDefault(submodulePart,
                    submodulePart.substring(0, Math.min(3, submodulePart.length())).toUpperCase());
            String actionCode = ACTION_MAP.getOrDefault(actionPart,
                    actionPart.substring(0, 1).toUpperCase());

            return moduleAbbrev + ":" + submoduleAbbrev + ":" + actionCode;
        }

        // Handle 2-part permissions: APPOINTMENTS_VIEW (APT:V) or SETTINGS_USERS
        // (SET:USR)
        if (parts.length == 2) {
            String modulePart = parts[0];
            String secondPart = parts[1];

            String moduleAbbrev = MODULE_ABBREV.getOrDefault(modulePart,
                    modulePart.substring(0, Math.min(3, modulePart.length())).toUpperCase());

            // CRITICAL: Check if second part is a known action or a submodule
            if (ACTION_MAP.containsKey(secondPart)) {
                return moduleAbbrev + ":" + ACTION_MAP.get(secondPart);
            } else if (SUBMODULE_ABBREV.containsKey(secondPart)) {
                return moduleAbbrev + ":" + SUBMODULE_ABBREV.get(secondPart);
            } else {
                // Fallback: use first char of second part
                return moduleAbbrev + ":" + secondPart.substring(0, 1).toUpperCase();
            }
        }

        // Handle multi-part permissions (>= 3 parts but not detected as 3-part)
        if (parts.length > 2) {
            String modulePart = parts[0];
            String actionPart = parts[parts.length - 1];

            String moduleAbbrev = MODULE_ABBREV.getOrDefault(modulePart,
                    modulePart.substring(0, Math.min(3, modulePart.length())).toUpperCase());
            String actionCode = ACTION_MAP.getOrDefault(actionPart,
                    actionPart.substring(0, 1).toUpperCase());

            return moduleAbbrev + ":" + actionCode;
        }

        // Fallback: return as-is
        return permission;
    }

    /**
     * Expand a single compressed permission code.
     * Supports both 2-part (APT:V) and 3-part (SET:USR:V) compressed formats.
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

        // Handle MODULE: D:MOD -> MODULE_DASHBOARD
        if (parts.length == 2 && "MOD".equals(parts[1])) {
            String moduleName = MODULE_REVERSE_ABBREV.getOrDefault(parts[0], parts[0]);
            return MODULE_PREFIX + moduleName;
        }

        // CRITICAL: Check colon count to determine expansion strategy
        // Handle 3-part compressed: SET:USR:V -> SETTINGS_USERS_VIEW
        if (parts.length == 3) {
            String moduleAbbrev = parts[0]; // "SET"
            String submoduleAbbrev = parts[1]; // "USR"
            String actionCode = parts[2]; // "V"

            String moduleName = MODULE_REVERSE_ABBREV.getOrDefault(moduleAbbrev, moduleAbbrev);
            String submoduleName = SUBMODULE_REVERSE_ABBREV.getOrDefault(submoduleAbbrev, submoduleAbbrev);
            String actionName = ACTION_REVERSE_MAP.getOrDefault(actionCode, actionCode);

            return moduleName + "_" + submoduleName + "_" + actionName;
        }

        // Handle 2-part compressed
        if (parts.length == 2) {
            String moduleAbbrev = parts[0];
            String secondCode = parts[1];

            String moduleName = MODULE_REVERSE_ABBREV.getOrDefault(moduleAbbrev, moduleAbbrev);

            // CRITICAL: Check if second code is an action or a submodule
            if (ACTION_REVERSE_MAP.containsKey(secondCode)) {
                return moduleName + "_" + ACTION_REVERSE_MAP.get(secondCode);
            } else if (SUBMODULE_REVERSE_ABBREV.containsKey(secondCode)) {
                return moduleName + "_" + SUBMODULE_REVERSE_ABBREV.get(secondCode);
            } else {
                // Fallback: just join with underscore
                return moduleName + "_" + secondCode;
            }
        }

        // Invalid format, return as-is
        return compressed;
    }
}
