export const MODULE_ID = 'dev-mode';
export const MODULE_ABBREV = 'DEV';

export const TEMPLATES = {
  settings: `modules/${MODULE_ID}/templates/settings.hbs`,
};

export enum MySettings {
  overrideConfigDebug = 'override-config-debug',
  moduleSpecificDebug = 'module-specific-debug',
  debugOverrides = 'debug-overrides',
}

export enum MyFlags {}
