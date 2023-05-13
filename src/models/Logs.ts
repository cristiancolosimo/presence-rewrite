export const LogType = {
    GENERAL:0,
    LOGIN:1,
    LOGOUT:2,
    REGISTER:3,
    UNLOCK_INTERNAL_DOOR:4,
    UNLOCK_EXTERNAL_DOOR:5,
    EDIT_USER:6,
    DELETE_USER:7,
    ADD_USER:8,
    EXPORT_LOGS:9,
    SETUP_APPLICATION:100,
}

interface Log {
    id: number;
    userId: number;
    action: string;
    createdAt: Date;
}