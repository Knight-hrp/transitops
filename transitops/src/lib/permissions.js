export const ROLE_PERMISSIONS = {
    "Fleet Manager": {
        pages: [
            "dashboard",
            "vehicles",
            "drivers",
            "maintenance",
            "analytics",
        ],

        actions: [
            "create_vehicle",
            "edit_vehicle",
            "retire_vehicle",
            "create_maintenance",
            "close_maintenance",
        ],
    },

    Dispatcher: {
        pages: [
            "dashboard",
            "trips",
            "new_trip",
            "vehicles",
            "drivers",
        ],

        actions: [
            "create_trip",
            "dispatch_trip",
            "complete_trip",
            "cancel_trip",
        ],
    },

    "Safety Officer": {
        pages: [
            "dashboard",
            "drivers",
            "safety",
        ],

        actions: [
            "update_safety_score",
            "suspend_driver",
            "change_driver_status",
        ],
    },

    "Financial Analyst": {
        pages: [
            "dashboard",
            "vehicles",
            "fuel",
            "expenses",
            "analytics",
        ],

        actions: [
            "create_fuel_log",
            "create_expense",
            "export_csv",
        ],
    },
};