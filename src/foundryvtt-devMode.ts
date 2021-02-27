// Import TypeScript modules
import { MODULE_ABBREV, MODULE_ID, MySettings, TEMPLATES } from './module/constants';
import { registerSettings } from './module/settings.js';
import { log, setDebugOverrides } from './module/helpers';

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
  log(true, `Initializing ${MODULE_ID}`);

  // Assign custom classes and constants here

  // Register custom module settings
  registerSettings();

  // Preload Handlebars templates
  await loadTemplates(Object.values(flattenObject(TEMPLATES)));
});

Hooks.once('ready', () => {
  setDebugOverrides();
});
