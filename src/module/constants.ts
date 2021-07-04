export const MODULE_ID = '_dev-mode';
export const MODULE_ABBREV = 'DEV';

export const TEMPLATES = {
  settings: `modules/${MODULE_ID}/templates/settings.hbs`,
};

export enum MySettings {
  alwaysUnpause = 'always-unpause',
  debugOverrides = 'debug-overrides',
  overrideConfigDebug = 'override-config-debug',
  packageSpecificDebug = 'package-specific-debug',
  suppressTooSmall = 'suppress-too-small',
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
