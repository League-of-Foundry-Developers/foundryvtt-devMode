import { DevMode } from './module/classes/DevMode.mjs';
import { DevModeSettings } from './module/classes/DevModeSettings.mjs';
import { DevModeConfig } from './module/classes/DevModeConfig.mjs';
import { _devModeDisplayUsabilityErrors } from './module/patches/displayUsabilityErrors.mjs';
import { libWrapper } from './module/shim.mjs';

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
});

Hooks.on('ready', () => {
  if (game.paused && game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.alwaysUnpause)) {
    game.togglePause(false);
  }
});

const devModeTag = (relevantId, collection) => `
  <div class="dev-mode-tag">
    ${relevantId}
    <div class="dev-mode-tag-actions" data-entity-id="${relevantId}" data-collection="${collection}">
      <button class="dev-mode-copy" title=""><i class="far fa-copy"></i></button>
      <button class="dev-mode-print" title=""><i class="fa fa-terminal"></i></button>
    </div>
  </div>
`;

Hooks.on('renderSidebarDirectory', (directory, html) => {
  if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.showDirectoryIds)) {
    return;
  }
  html.find('.directory-item[data-entity-id]').each(function () {
    const relevantId = $(this).data()?.entityId;
    DevMode.log(false, { relevantId, data: $(this).data() });
    const collection = $(this).parents('[data-tab]').data()?.tab;

    $(this).addClass('dev-mode-anchor');
    $(this).append(devModeTag(relevantId, collection));
  });
});

Hooks.on('renderChatMessage', (chatMessage, html) => {
  if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.showChatIds)) {
    return;
  }
  html.append(devModeTag(chatMessage.id, 'messages'));
  html.addClass('dev-mode-anchor');
});

$('html').on('click', '.dev-mode-copy', function () {
  const toCopy = $(this).parents('[data-entity-id]').data()?.entityId;
  DevMode.log(false, {
    toCopy,
  });

  navigator.permissions.query({ name: 'clipboard-write' }).then((result) => {
    if (result.state == 'granted' || result.state == 'prompt') {
      /* write to the clipboard now */
      navigator.clipboard.writeText(toCopy).then(
        () => ui.notifications.notify('Copied to Clipboard', 'success'),
        () => ui.notifications.notify('Could not copy to Clipboard', 'error'),
      );
    }
  });
});

$('html').on('click', '.dev-mode-print', function () {
  const idToPrint = $(this).parents('[data-entity-id]').data()?.entityId;

  const tab = $(this).parents('[data-collection]').data()?.collection;

  const toPrint = game[tab].get(idToPrint);

  DevMode.log(false, {
    idToPrint,
    tab,
    toPrint,
  });

  console.log(toPrint);
  ui.notifications.notify('Printed to Console', 'success');
});
