import { DevModeConfig } from './classes/DevModeConfig';
import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';
import { setDebugOverrides } from './helpers';

export const registerSettings = function () {
  // (CONFIG[MODULE_ID] as Record<string, any>) = { debug: true };

  DevModeConfig.init();

  DevModeConfig.registerPackageDebugFlag(MODULE_ID, 'boolean');

  // register the setting where we'll enable or disable core debug overrides
  game.settings.register(MODULE_ID, MySettings.overrideConfigDebug, {
    name: `${MODULE_ABBREV}.settings.${MySettings.overrideConfigDebug}.Name`,
    default: false,
    type: Boolean,
    scope: 'client',
    config: true,
    hint: `${MODULE_ABBREV}.settings.${MySettings.overrideConfigDebug}.Hint`,
    onChange: (newValue) => {
      if (!newValue) {
        window.location.reload();
        return;
      }
      setDebugOverrides();
    },
  });
};
