import { DevMode } from '../classes/DevMode.mjs';

/**
 * Set up the dev-mode copy and print DOM plus listeners
 */
export default function setupDevModeAnchor() {
  const idAttribute = foundry.utils.isNewerVersion(game.version, 0.9) ? 'data-document-id' : 'data-entity-id';
  const idKey = foundry.utils.isNewerVersion(game.version, 0.9) ? 'documentId' : 'entityId';

  DevMode.log(false, 'setupDevModeAnchor', {
    idAttribute,
    idKey,
    version: game.version,
  });

  const devModeTag = (relevantId, collection) => `
  <div class="dev-mode-tag">
    ${relevantId}
    <div class="dev-mode-tag-actions"
    ${idAttribute}="${relevantId}"
    ${collection ? `data-collection="${collection}"` : ''}>
      <button class="dev-mode-copy" title=""><i class="far fa-copy"></i></button>
      ${collection ? '<button class="dev-mode-print" title=""><i class="fa fa-terminal"></i></button>' : ''}
    </div>
  </div>
  `;

  Hooks.on('renderSidebarDirectory', async (directory, html) => {
    if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.showDirectoryIds)) {
      return;
    }

    DevMode.log(false, 'renderSidebarDirectory', directory, {
      idAttribute,
    });

    if (directory.tabName === 'compendium') {
      html.find(`.directory-item[data-pack]`).each(function () {
        const relevantId = $(this).data()?.pack;
        const collection = 'packs';

        $(this).addClass('dev-mode-anchor');
        $(this).append(devModeTag(relevantId, collection));
      });
    } else {
      html.find(`.directory-item[${idAttribute}]`).each(function () {
        const relevantId = $(this).data()?.[idKey];
        const collection = $(this).parents('[data-tab]').data()?.tab;

        $(this).addClass('dev-mode-anchor');
        $(this).append(devModeTag(relevantId, collection));
      });
    }
  });

  Hooks.on('renderChatMessage', async (chatMessage, html) => {
    if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.showChatIds)) {
      return;
    }

    html.append(devModeTag(chatMessage.id, 'messages'));
    html.addClass('dev-mode-anchor');
  });

  Hooks.on('renderCompendium', async (compendium, html) => {
    if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.showCompendiumIds)) {
      return;
    }

    DevMode.log(false, 'renderCompendium', compendium, {
      idAttribute,
    });

    html.find(`.directory-item[${idAttribute}]`).each(function () {
      const relevantId = $(this).data()?.[idKey];

      $(this).addClass('dev-mode-anchor');
      $(this).append(devModeTag(relevantId));
    });
  });

  /**
   * Any DOM element with the `.dev-mode-copy` class will look up the tree for an element
   * with `${idAttribute}` attribute and copy that attribute's value when clicked.
   */
  $('html').on('click', '.dev-mode-copy', function (event) {
    event.preventDefault();
    event.stopPropagation();

    const toCopy = $(this).parents(`[${idAttribute}]`).data()?.[idKey];
    DevMode.log(false, {
      toCopy,
    });

    navigator.permissions.query({ name: 'clipboard-write' }).then((result) => {
      if (result.state == 'granted' || result.state == 'prompt') {
        /* write to the clipboard now */
        navigator.clipboard.writeText(toCopy).then(
          () => ui.notifications.notify(game.i18n.localize('DEV.clipboard.success'), 'success'),
          () => ui.notifications.notify(game.i18n.localize('DEV.clipboard.failed'), 'error'),
        );
      }
    });
  });

  /**
   * Any DOM element with the `.dev-mode-print` class will look up the tree for an element
   * with `${idAttribute}` and `data-collection` and then print the correct document to
   * console.
   */
  $('html').on('click', '.dev-mode-print', function (event) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const idToPrint = $(this).parents(`[${idAttribute}]`).data()?.[idKey];

      const tab = $(this).parents('[data-collection]').data()?.collection;

      if (!tab || !idToPrint) {
        return;
      }

      const toPrint = game[tab].get(idToPrint);

      DevMode.log(false, {
        idToPrint,
        tab,
        toPrint,
      });

      DevMode.fancyLog(toPrint);
    } catch (e) {
      ui.notifications.notify('Error Printing to Console', 'error');

      console.error(e);
    }
  });
}
