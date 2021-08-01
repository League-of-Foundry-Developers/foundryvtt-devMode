import { DevModeConfig } from './classes/DevModeConfig';
import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';
import { setDebugOverrides } from './helpers';

//@ts-ignore
const debouncedReload = foundry.utils.debounce(() => {
  window.location.reload();
}, 100);

const settingsToRegister = [
  {
    key: MySettings.overrideConfigDebug,
    onChange: (newValue) => {
      if (!newValue) {
        debouncedReload();
        return;
      }
      setDebugOverrides();
    },
  },
  { key: MySettings.suppressTooSmall, default: true },
  { key: MySettings.alwaysUnpause, default: true },
];

export const registerSettings = function () {
  DevModeConfig.init();

  DevModeConfig.registerPackageDebugFlag(MODULE_ID, 'boolean');

  settingsToRegister.forEach(({ key, ...rest }) => {
    game.settings.register(MODULE_ID, key, {
      name: `${MODULE_ABBREV}.settings.${key}.Name`,
      default: false,
      type: Boolean,
      scope: 'client',
      config: true,
      hint: `${MODULE_ABBREV}.settings.${key}.Hint`,
      ...rest,
    });
  });
};
