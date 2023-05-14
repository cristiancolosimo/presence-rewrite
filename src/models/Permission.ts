interface Permission {
    id: number;
    name: string;
}

export const PermissionType = {
    SUPER_ADMIN: "super-admin",
    UNLOCK_INTERNAL_DOOR: "unlock-internal-door",
    UNLOCK_EXTERNAL_DOOR: "unlock-external-door",
}
export const PermissionTypeString = {
    "super-admin": "Super Admin",
    "unlock-internal-door": "Sblocco porta interna",
    "unlock-external-door": "Sblocco porta esterna",
}