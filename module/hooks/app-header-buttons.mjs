import { DevMode } from '../classes/DevMode.mjs';

/**
 * Adds button to the header of all document sheets that prints the document to console.
 *
 */
export default function setupApplicationHeaderPrintButton() {
  // several common sheets do not call `documentSheet` hooks
  const hooks = [
    'getDocumentSheetHeaderButtons',
    'getItemSheetHeaderButtons',
    'getActorSheetHeaderButtons',
    'getTokenConfigHeaderButtons',
  ];

  const callback = async (app, buttons) => {
    if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.appHeaderButton)) {
      return;
    }

    if (app.object) {
      buttons.unshift({
        class: 'console-print',
        icon: 'fa fa-terminal',
        label: '',
        onclick: () => {
          DevMode.fancyLog(app.object);
        },
      });
    }
  };

  hooks.forEach((hookName) => {
    Hooks.on(hookName, callback);
  });

  // Adds to Compendium Header
  Hooks.on('getCompendiumHeaderButtons', async (app, buttons) => {
    if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.appHeaderButton)) {
      return;
    }

    if (app.collection) {
      buttons.unshift({
        class: 'console-print',
        icon: 'fa fa-terminal',
        label: '',
        onclick: () => {
          DevMode.fancyLog(app.collection);
        },
      });
    }
  });
}
