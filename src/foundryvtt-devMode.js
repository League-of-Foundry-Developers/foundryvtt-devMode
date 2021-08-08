// Import TypeScript modules
import { MODULE_ABBREV, MODULE_ID, MySettings, TEMPLATES } from './module/constants';
import { registerSettings } from './module/settings.js';
import { log, setDebugOverrides } from './module/helpers';
import { DevModeConfig } from './module/classes/DevModeConfig';
import { libWrapper } from './module/shim';

Handlebars.registerHelper('dev-concat', (...args) => {
  log(false, args);
  // Ignore the object appended by handlebars.
  if (typeof args[args.length - 1] === 'object') {
    args.pop();
  }
  return args.join('');
});

function _devModeDisplayUsabilityErrors(wrapped) {
  const suppressTooSmall = game.settings.get(MODULE_ID, MySettings.suppressTooSmall);

  if (suppressTooSmall) {
    // Unsupported Chromium version
    const MIN_CHROMIUM_VERSION = 80;
    const chromium = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    if (chromium && parseInt(chromium[2]) < MIN_CHROMIUM_VERSION) {
      if (ui.notifications) {
        ui.notifications.error(
          game.i18n.format('ERROR.ChromiumVersion', {
            version: chromium[2],
            minimum: MIN_CHROMIUM_VERSION,
          }),
          { permanent: true }
        );
      }
    }
    return;
  }

  wrapped();
}

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
  log(true, `Initializing ${MODULE_ID}`);

  registerSettings();
  setDebugOverrides();

  libWrapper.register('_dev-mode', 'Game.prototype._displayUsabilityErrors', _devModeDisplayUsabilityErrors, 'MIXED');

  game.modules.get(MODULE_ID).api = {
    registerPackageDebugFlag: DevModeConfig.registerPackageDebugFlag,
    getPackageDebugValue: DevModeConfig.getPackageDebugValue,
  };

  window[MODULE_ABBREV] = game.modules.get(MODULE_ID).api;

  globalThis[MODULE_ABBREV] = {
    registerPackageDebugFlag: function (...args) {
      console.warn(
        MODULE_ID,
        '|',
        'accessing the module api on globalThis is deprecated and will be removed in a future update'
      );
      return game.modules.get(MODULE_ID).api?.registerPackageDebugFlag(...args);
    },
    getPackageDebugValue: function (...args) {
      console.warn(
        MODULE_ID,
        '|',
        'accessing the module api on globalThis is deprecated and will be removed in a future update'
      );
      return game.modules.get(MODULE_ID).api?.getPackageDebugValue(...args);
    },
  };

  // register any modules as they init
  Hooks.callAll('devModeReady', game.modules.get(MODULE_ID).api);

  // Preload Handlebars templates
  await loadTemplates(Object.values(flattenObject(TEMPLATES)));

  // add :mage: button to the foundry logo
  $('#logo').after(`<button type='button' id="dev-mode-button">🧙</button>`);
  $('#dev-mode-button').on('click', () => {
    const devModeConfig = new DevModeConfig();
    devModeConfig.render(true);
  });
});

Hooks.on('ready', () => {
  if (game.paused && game.settings.get(MODULE_ID, MySettings.alwaysUnpause)) {
    game.togglePause(false);
  }
});
