import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_PACKAGES, MOCK_ROLES } from '../data/mockData';

export const usePermissionStore = create(
    persist(
        (set, get) => ({
            packages: MOCK_PACKAGES,
            roles: MOCK_ROLES,

            // --- PACKAGE ACTIONS ---
            addPackage: (newPkg) => set((state) => ({
                packages: [...state.packages, { ...newPkg, id: Date.now(), permissions: [] }]
            })),
            updatePackage: (id, updatedPkg) => set((state) => ({
                packages: state.packages.map(p => p.id === id ? { ...p, ...updatedPkg } : p)
            })),
            deletePackage: (id) => set((state) => ({
                packages: state.packages.filter(p => p.id !== id)
            })),
            togglePermissionInPackage: (pkgId, permId) => set((state) => ({
                packages: state.packages.map(p => {
                    if (p.id !== pkgId) return p;
                    const permissions = p.permissions.includes(permId)
                        ? p.permissions.filter(id => id !== permId)
                        : [...p.permissions, permId];
                    return { ...p, permissions };
                })
            })),

            // --- ROLE ACTIONS ---
            addRole: (newRole) => set((state) => ({
                roles: [...state.roles, { ...newRole, id: Date.now(), packages: [] }]
            })),
            updateRole: (id, updatedRole) => set((state) => ({
                roles: state.roles.map(r => r.id === id ? { ...r, ...updatedRole } : r)
            })),
            deleteRole: (id) => set((state) => ({
                roles: state.roles.filter(r => r.id !== id)
            })),
            togglePackageInRole: (roleId, pkgId) => set((state) => ({
                roles: state.roles.map(r => {
                    if (r.id !== roleId) return r;
                    const packages = r.packages.includes(pkgId)
                        ? r.packages.filter(id => id !== pkgId)
                        : [...r.packages, pkgId];
                    return { ...r, packages };
                })
            })),
        }),
        {
            name: 'terra-permissions-storage',
        }
    )
);
