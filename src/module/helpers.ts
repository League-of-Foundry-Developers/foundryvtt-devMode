import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';

export function log(force: boolean, ...args) {
  //@ts-ignore
  if (force || CONFIG[MODULE_ID].debug === true) {
    console.log(MODULE_ID, '|', ...args);
  }
}

export function setDebugOverrides() {
  // set all debug values to match settings
  Object.keys(CONFIG.debug).forEach((debugKey) => {
    if (game.settings.get(MODULE_ID, MySettings.debugOverrides).debugKey !== undefined) {
      CONFIG.debug[debugKey] = game.settings.get(MODULE_ID, MySettings.debugOverrides).debugKey;
    }
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
