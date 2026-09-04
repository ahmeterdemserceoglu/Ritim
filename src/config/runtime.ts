export const RITIM_SERVER_URL = (process.env.EXPO_PUBLIC_RITIM_SERVER_URL || '').replace(/\/$/, '');
export const SERVER_ENABLED = RITIM_SERVER_URL.length > 0;
