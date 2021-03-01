export const MODULE_ID = '_dev-mode';
export const MODULE_ABBREV = 'DEV';

export const TEMPLATES = {
  settings: `modules/${MODULE_ID}/templates/settings.hbs`,
};

export enum MySettings {
  overrideConfigDebug = 'override-config-debug',
  packageSpecificDebug = 'package-specific-debug',
  debugOverrides = 'debug-overrides',
}

export enum MyFlags {}

export enum LogLevel {
  NONE = 0,
  INFO = 1,
  ERROR = 2,
  DEBUG = 3,
  WARN = 4,
  ALL = 5,
}
