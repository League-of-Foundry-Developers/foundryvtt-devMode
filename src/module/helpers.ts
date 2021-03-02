import { DevModeConfig } from './classes/DevModeConfig';
import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';

export function log(force: boolean, ...args) {
  try {
    //@ts-ignore
    const isDebugging = true; // window.DEV?.getPackageDebugValue(MODULE_ID, 'boolean');

    const shouldLog = force || isDebugging;
    //@ts-ignore
    if (shouldLog) {
      console.log(MODULE_ID, '|', ...args);
    }
  } catch (e) {}
}

export function setDebugOverrides() {
  if (!game.settings.get(MODULE_ID, MySettings.overrideConfigDebug)) {
    log(false, 'doing nothing in setDebugOverrides');
    return;
  }

  const debugOverrideSettings = game.settings.get(MODULE_ID, MySettings.debugOverrides);

  // set all debug values to match settings
  Object.keys(CONFIG.debug).forEach((debugKey) => {
    const relevantSetting = debugOverrideSettings[debugKey];

    if (relevantSetting !== undefined) {
      CONFIG.debug[debugKey] = relevantSetting;
    }

    log(false, 'setDebugOverride', debugKey, {
      relevant: relevantSetting,
      after: CONFIG.debug[debugKey],
    });
  });
}

export function localizeWithFallback(debugKey: keyof typeof CONFIG['debug'], translation: 'Name' | 'Hint') {
  const localizationKey = `${MODULE_ABBREV}.settings.${debugKey}.${translation}`;
  const hasTranslation = game.i18n.has(localizationKey);

  if (hasTranslation) {
    return game.i18n.localize(localizationKey);
  }

  if (translation === 'Name') {
    return debugKey;
  }

  return undefined;
}
