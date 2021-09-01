import { DevMode } from './module/classes/DevMode.mjs';
import { DevModeSettings } from './module/classes/DevModeSettings.mjs';
import { DevModeConfig } from './module/classes/DevModeConfig.mjs';
import { _devModeDisplayUsabilityErrors } from './module/patches/displayUsabilityErrors.mjs';
import { libWrapper } from './module/shim.mjs';
import setupDevModeAnchor from './module/hooks/dev-mode-anchor.mjs';
import setupDisableTemplateCache from './module/patches/getTemplate.mjs';

Handlebars.registerHelper('dev-concat', (...args) => {
  DevMode.log(false, args);
  // Ignore the object appended by handlebars.
  if (typeof args[args.length - 1] === 'object') {
    args.pop();
  }
  return args.join('');
});

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', function () {
  DevMode.log(true, `Initializing ${DevMode.MODULE_ID}`);

  DevModeSettings.registerSettings();

  DevMode.registerPackageDebugFlag(DevMode.MODULE_ID, 'boolean');

  DevMode.setDebugOverrides();

  game.modules.get(DevMode.MODULE_ID).api = DevMode.API;

  // register any modules as they init
  Hooks.callAll('devModeReady', DevMode.API);

  // add :mage: button to the foundry logo
  $('#logo').after(`<button type='button' id="dev-mode-button">🧙</button>`);
  $('#dev-mode-button').on('click', () => {
    const devModeConfig = new DevModeConfig();
    devModeConfig.render(true);
  });

  // Preload Handlebars templates
  loadTemplates(Object.values(flattenObject(DevMode.TEMPLATES)));

  libWrapper.register(
    DevMode.MODULE_ID,
    'Game.prototype._displayUsabilityErrors',
    _devModeDisplayUsabilityErrors,
    'MIXED',
  );

  if (game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.disableTemplateCache)) {
    setupDisableTemplateCache();
  }
});

Hooks.on('ready', () => {
  if (game.paused && game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.alwaysUnpause)) {
    game.togglePause(false);
  }
});

setupDevModeAnchor();
