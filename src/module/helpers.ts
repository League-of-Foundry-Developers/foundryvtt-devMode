import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';

export function log(force: boolean, ...args) {
  //@ts-ignore
  if (force || CONFIG[MODULE_ID].debug === true) {
    console.log(MODULE_ID, '|', ...args);
  }
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

    log(false, 'setDebugOverride', {
      relevant: relevantSetting,
      after: CONFIG.debug[debugKey],
    });
  });
}

export function localizeWithFallback(debugKey: keyof typeof CONFIG['debug'], translation: 'Name' | 'Hint') {
  const localizationKey = `${MODULE_ABBREV}.settings.${debugKey}.${translation}`;
  const hasTranslation = game.i18n.has(localizationKey);

  log(false, 'settingNameWithFallback', { debugKey, hasTranslation });

  if (hasTranslation) {
    return game.i18n.localize(localizationKey);
  }

  if (translation === 'Name') {
    return debugKey;
  }

  return undefined;
}
