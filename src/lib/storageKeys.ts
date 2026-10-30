/**
 * Unified Storage Key Constants
 *
 * Segregates demo business records, user preferences, and authentication sessions
 * into distinct browser storage partitions so that resetting demo records never
 * clears user preferences, UI settings, or active sessions.
 */
export const STORAGE_KEYS = {
  // Operational business records (clients, quotations, visits, advances, expenses, lists)
  DEMO_DATA: 'home_automation_crm_demo_data_v2',

  // User UI and operational preferences (theme, webhook URL, column visibility, page sizes)
  USER_PREFERENCES: 'home_automation_crm_user_prefs_v1',

  // Authentication session state (currentUser, safe user metadata - strictly no secrets)
  AUTH_SESSION: 'home_automation_crm_auth_session_v1',

  // Legacy monolithic storage key (used solely for automatic backwards-compatible migration)
  LEGACY_MONOLITH: 'home_automation_crm_store_v1',
} as const;
