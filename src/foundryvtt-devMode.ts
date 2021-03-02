// Import TypeScript modules
import { MODULE_ABBREV, MODULE_ID, MySettings, TEMPLATES } from './module/constants';
import { registerSettings } from './module/settings.js';
import { log, setDebugOverrides } from './module/helpers';
import { DevModeConfig } from './module/classes/DevModeConfig';

Handlebars.registerHelper('dev-concat', (...args) => {
  log(false, args);
  // Ignore the object appended by handlebars.
  if (typeof args[args.length - 1] === 'object') {
    args.pop();
  }
  return args.join('');
});

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
  log(true, `Initializing ${MODULE_ID}`);

  registerSettings();
  setDebugOverrides();

  window[MODULE_ABBREV] = {
    registerPackageDebugFlag: DevModeConfig.registerPackageDebugFlag,
    getPackageDebugValue: DevModeConfig.getPackageDebugValue,
  };

  // register any modules as they init
  Hooks.callAll('devModeReady', window[MODULE_ABBREV]);

  // Preload Handlebars templates
  await loadTemplates(Object.values(flattenObject(TEMPLATES)));
});
