import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';
import { setDebugOverrides } from './helpers';

function settingNameWithFallback(debugKey: keyof typeof CONFIG['debug']) {
  const translations = game.i18n._getTranslations(`${MODULE_ABBREV}.settings.${debugKey}.Name`);
}

export const registerSettings = function () {
  // Register a setting for each CONFIG.debug option which is a boolean
  Object.keys(CONFIG.debug).forEach((debugKey) => {
    switch (typeof CONFIG.debug[debugKey]) {
      case 'boolean': {
        game.settings.register(MODULE_ID, debugKey, {
          name: `${MODULE_ABBREV}.settings.${debugKey}.Name`,
          default: false,
          type: Boolean,
          scope: 'client',
          config: true,
          hint: `${MODULE_ABBREV}.settings.${debugKey}.Hint`,
          onChange: (newValue) => {
            CONFIG.debug[debugKey] = newValue;
          },
        });
        break;
      }
      default: {
        console.log('did not register dev-mode setting for unknown config type which was not a boolean');
      }
    }
  });

  // register the setting where we'll store all module specific debug flags
  game.settings.register(MODULE_ID, MySettings.overrideConfigDebug, {
    name: `${MODULE_ABBREV}.settings.${MySettings.overrideConfigDebug}.Name`,
    default: false,
    type: Boolean,
    scope: 'client',
    config: true,
    hint: `${MODULE_ABBREV}.settings.${MySettings.overrideConfigDebug}.Hint`,
    onChange: (newValue) => {
      if (!newValue) {
        return;
      }
      setDebugOverrides();
    },
  });

  // register the setting where we'll store all module specific debug flags
  game.settings.register(MODULE_ID, MySettings.moduleSpecificDebug, {
    default: {},
    type: Object,
    scope: 'client',
    config: false,
  });
};
