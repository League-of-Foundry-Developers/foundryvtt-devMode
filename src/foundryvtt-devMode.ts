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

  libWrapper.register(
    '_dev-mode',
    'Game.prototype._displayUsabilityErrors',
    _devModeDisplayUsabilityErrors,
    'OVERRIDE'
  );

  window[MODULE_ABBREV] = {
    registerPackageDebugFlag: DevModeConfig.registerPackageDebugFlag,
    getPackageDebugValue: DevModeConfig.getPackageDebugValue,
  };

  // register any modules as they init
  Hooks.callAll('devModeReady', window[MODULE_ABBREV]);

  // Preload Handlebars templates
  await loadTemplates(Object.values(flattenObject(TEMPLATES)));
});
