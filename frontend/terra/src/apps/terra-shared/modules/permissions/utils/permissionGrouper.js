/**
 * Permission Grouper Utility
 * 
 * Groups permissions by parentPermissionId (hierarchical grouping).
 * CRITICAL: Uses parentPermissionId from backend, NOT prefix matching.
 * 
 * Input: List<PermissionResponseDTO>
 * Output: List<{moduleId, moduleName, permissions: List<PermissionResponseDTO>, isModuleAssigned: boolean}>
 */

/**
 * Group permissions by their parent MODULE permission.
 * 
 * @param {Array} permissions - List<PermissionResponseDTO> from backend
 * @param {Array} modules - List<Permission> (MODULE level) to check if module is assigned
 * @returns {Array} Grouped permissions by module
 */
export const groupPermissionsByModule = (permissions, modules = []) => {
    if (!Array.isArray(permissions) || permissions.length === 0) {
        return [];
    }

    // CRITICAL: Filter out MODULE permissions (only group ACTION permissions)
    // MODULE permissions have parentPermissionId === null
    const actionPermissions = permissions.filter(p => 
        p.type === 'ACTION' && p.parentPermissionId !== null
    );

    if (actionPermissions.length === 0) {
        return [];
    }

    // Group by parentPermissionId
    const groupedMap = new Map();

    actionPermissions.forEach(permission => {
        const parentId = permission.parentPermissionId;
        const parentName = permission.parentPermissionName;

        if (!parentId || !parentName) {
            // Skip permissions without parent (shouldn't happen for ACTION permissions)
            console.warn('Permission without parent:', permission);
            return;
        }

        if (!groupedMap.has(parentId)) {
            // Check if module is assigned (for isModuleAssigned flag)
            const isModuleAssigned = Array.isArray(modules) && modules.length > 0 && modules.some(m => 
                m && (m.id === parentId || m.name === parentName)
            );

            groupedMap.set(parentId, {
                moduleId: parentId,
                moduleName: parentName,
                permissions: [],
                isModuleAssigned
            });
        }

        groupedMap.get(parentId).permissions.push(permission);
    });

    // Convert map to array and sort by module name
    const grouped = Array.from(groupedMap.values());
    grouped.sort((a, b) => {
        const nameA = a.moduleName || '';
        const nameB = b.moduleName || '';
        return nameA.localeCompare(nameB);
    });

    return grouped;
};

/**
 * Filter out Super Admin permissions from the list.
 * 
 * @param {Array} permissions - List<PermissionResponseDTO>
 * @returns {Array} Filtered permissions (Super Admin permissions removed)
 */
export const filterSuperAdminPermissions = (permissions) => {
    if (!Array.isArray(permissions)) {
        return [];
    }

    return permissions.filter(p => {
        // Filter out SUPERADMIN_* permissions
        if (p.name && p.name.startsWith('SUPERADMIN_')) {
            return false;
        }
        // Filter out MODULE_SUPERADMIN
        if (p.name === 'MODULE_SUPERADMIN' || p.parentPermissionName === 'MODULE_SUPERADMIN') {
            return false;
        }
        return true;
    });
};

/**
 * Get all unique module names from permissions.
 * 
 * @param {Array} permissions - List<PermissionResponseDTO>
 * @returns {Array} List of unique module names
 */
export const getModuleNames = (permissions) => {
    if (!Array.isArray(permissions)) {
        return [];
    }

    const moduleNames = new Set();
    permissions.forEach(p => {
        if (p.parentPermissionName) {
            moduleNames.add(p.parentPermissionName);
        }
    });

    return Array.from(moduleNames).sort();
};
