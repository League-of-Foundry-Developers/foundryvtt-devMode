import { MODULE_ABBREV, MODULE_ID, MySettings, TEMPLATES } from '../constants';
import { log } from '../helpers';
import { GmScreenConfig, GmScreenGrid } from '../../gridTypes';

const defaultGmScreenConfig: GmScreenConfig = {
  activeGridId: 'default',
  grids: {
    default: {
      name: 'Main',
      id: 'default',
      entries: {},
    },
  },
};

export class DevModeOverrides extends FormApplication {
  static init() {
    // register this FormApplication as a settings menu
    game.settings.registerMenu(MODULE_ID, 'menu', {
      name: `${MODULE_ABBREV}.settings.${MySettings.overrideConfig}.Name`,
      label: `${MODULE_ABBREV}.settings.${MySettings.overrideConfig}.Label`,
      icon: 'fas fa-table',
      type: DevModeOverrides,
      restricted: true,
      hint: `${MODULE_ABBREV}.settings.${MySettings.overrideConfig}.Hint`,
    });

    // register the setting where we'll store all module specific debug flags
    game.settings.register(MODULE_ID, MySettings.moduleSpecificDebug, {
      default: {},
      type: Object,
      scope: 'client',
      config: false,
    });
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      classes: ['gm-screen-config'],
      closeOnSubmit: false,
      height: 'auto',
      submitOnChange: false,
      submitOnClose: false,
      template: TEMPLATES.settings,
      title: game.i18n.localize(`${MODULE_ABBREV}.gridConfig.GridConfig`),
      width: 600,
    };
  }

  constructor(object = {}, options) {
    super(object, options);
  }

  get rows(): number {
    return game.settings.get(MODULE_ID, MySettings.rows);
  }

  get columns(): number {
    return game.settings.get(MODULE_ID, MySettings.columns);
  }

  get settingsData() {
    const gmScreenConfig: GmScreenConfig = game.settings.get(MODULE_ID, MySettings.gmScreenConfig);

    log(false, 'getSettingsData', {
      gmScreenConfig,
    });

    return {
      grids: gmScreenConfig.grids,
    };
  }

  getData() {
    const data = {
      ...super.getData(),
      settings: this.settingsData,
      defaultRows: this.rows,
      defaultColumns: this.columns,
    };

    log(false, data);
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    log(false, 'activateListeners', {
      html,
    });

    const handleNewRowClick = async (currentTarget: JQuery<any>) => {
      log(false, 'add row clicked', {
        data: currentTarget.data(),
      });

      const table = currentTarget.data().table;

      const tableElement = currentTarget.siblings('table');
      const tbodyElement = $(tableElement).find('tbody');

      const newGridRowTemplateData = {
        gridId: randomID(),
        grid: {
          name: '',
          columnOverride: '',
          rowOverride: '',
        },
        defaultColumns: this.columns,
        defaultRows: this.rows,
      };

      const newRow = $(await renderTemplate(TEMPLATES[table].tableRow, newGridRowTemplateData));
      // render a new row at the end of tbody
      tbodyElement.append(newRow);
      this.setPosition({}); // recalc height
    };

    const handleDeleteRowClick = (currentTarget: JQuery<any>) => {
      log(false, 'delete row clicked', {
        currentTarget,
      });

      currentTarget.parentsUntil('tbody').remove();
      this.setPosition({}); // recalc height
    };

    html.on('click', (e) => {
      const currentTarget = $(e.target).closest('button')[0];

      if (!currentTarget) {
        return;
      }

      const wrappedCurrentTarget = $(currentTarget);

      log(false, 'a button was clicked', { e, currentTarget });

      if (wrappedCurrentTarget.hasClass('add-row')) {
        handleNewRowClick(wrappedCurrentTarget);
      }
      if (wrappedCurrentTarget.hasClass('delete-row')) {
        handleDeleteRowClick(wrappedCurrentTarget);
      }
    });
  }

  // grids: {
  //   default: {
  //     name: 'Main',
  //     id: 'default',
  //     entries: {},
  //   },
  // },

  async _updateObject(ev, formData) {
    const gmScreenConfig: GmScreenConfig = game.settings.get(MODULE_ID, MySettings.gmScreenConfig);

    const data = expandObject(formData);

    log(false, {
      formData,
      data,
    });

    if (Object.keys(data).length === 0) {
      ui.notifications.error(game.i18n.localize(`${MODULE_ABBREV}.gridConfig.errors.empty`));
      throw 'Cannot save the grid with no tabs.';
    }

    const newGridIds = Object.keys(data.grids);

    const newGrids = newGridIds.reduce<GmScreenConfig['grids']>((acc, gridId) => {
      const grid = data.grids[gridId];

      // if this grid exists already, modify it
      if (gmScreenConfig.grids.hasOwnProperty(gridId)) {
        acc[gridId] = {
          ...gmScreenConfig.grids[gridId],
          ...grid,
        };

        return acc;
      }

      // otherwise create it
      acc[gridId] = {
        ...grid,
        entries: {},
        name: grid.name ?? '',
        id: gridId,
      };

      return acc;
    }, {});

    // handle case where active tab is deleted
    const newActiveGridId = newGridIds.includes(gmScreenConfig.activeGridId)
      ? gmScreenConfig.activeGridId
      : newGridIds[0];

    const newGmScreenConfig: GmScreenConfig = {
      ...gmScreenConfig,
      grids: newGrids,
      activeGridId: newActiveGridId,
    };

    log(true, 'setting settings', {
      newGmScreenConfig,
    });

    await game.settings.set(MODULE_ID, MySettings.gmScreenConfig, newGmScreenConfig);

    window[MODULE_ID].refreshGmScreen();

    this.close();
  }
}
