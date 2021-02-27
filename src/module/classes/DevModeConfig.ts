import { MODULE_ABBREV, MODULE_ID, MySettings, TEMPLATES } from '../constants';
import { log, setDebugOverrides, localizeWithFallback } from '../helpers';

export class DevModeConfig extends FormApplication {
  static init() {
    // register this FormApplication as a settings menu
    game.settings.registerMenu(MODULE_ID, 'config-menu', {
      name: `${MODULE_ABBREV}.settings.config-menu.Name`,
      label: `${MODULE_ABBREV}.settings.config-menu.Label`,
      icon: 'fas fa-cogs',
      type: DevModeConfig,
      restricted: false,
      hint: `${MODULE_ABBREV}.settings.config-menu.Hint`,
    });

    // register the setting where we'll store all module specific debug flags
    game.settings.register(MODULE_ID, MySettings.moduleSpecificDebug, {
      default: {},
      type: Object,
      scope: 'client',
      config: false,
    });

    // register the setting where we'll store all debug override flags
    game.settings.register(MODULE_ID, MySettings.debugOverrides, {
      default: CONFIG.debug,
      type: Object,
      scope: 'client',
      config: false,
      onChange: () => {
        setDebugOverrides(); // assumption: this runs after the setting has been set
      },
    });

    // Register a setting for each CONFIG.debug option which is a boolean
    // Object.keys(CONFIG.debug).forEach((debugKey) => {
    //   switch (typeof CONFIG.debug[debugKey]) {
    //     case 'boolean': {
    //       game.settings.register(MODULE_ID, debugKey, {
    //         name: `${MODULE_ABBREV}.settings.${debugKey}.Name`,
    //         default: false,
    //         type: Boolean,
    //         scope: 'client',
    //         config: true,
    //         hint: `${MODULE_ABBREV}.settings.${debugKey}.Hint`,
    //         onChange: (newValue) => {
    //           CONFIG.debug[debugKey] = newValue;
    //         },
    //       });
    //       break;
    //     }
    //     default: {
    //       console.log('did not register dev-mode setting for unknown config type which was not a boolean');
    //     }
    //   }
    // });
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      classes: ['dev-mode-config'],
      closeOnSubmit: false,
      height: 'auto' as 'auto',
      submitOnChange: false,
      submitOnClose: false,
      tabs: [
        {
          navSelector: '.tabs',
          contentSelector: 'form',
          initial: 'config',
        },
      ],
      template: TEMPLATES.settings,
      title: game.i18n.localize(`${MODULE_ABBREV}.configMenu.FormTitle`),
      width: 400,
    };
  }

  get moduleSpecificDebug() {
    return game.settings.get(MODULE_ID, MySettings.moduleSpecificDebug);
  }

  get debugOverrides() {
    return game.settings.get(MODULE_ID, MySettings.debugOverrides);
  }

  getData() {
    const debugOverrideSettings = Object.keys(CONFIG.debug).map((debugKey: keyof typeof CONFIG['debug']) => {
      switch (typeof CONFIG.debug[debugKey]) {
        case 'boolean': {
          return {
            name: localizeWithFallback(debugKey, 'Name'),
            hint: localizeWithFallback(debugKey, 'Hint'),
            value: this.debugOverrides[debugKey],
            key: debugKey,
            isCheckbox: true,
          };
        }
        default: {
          console.log('did not register dev-mode setting for unknown config type which was not a boolean');
        }
      }
    });

    const data = {
      ...super.getData(),
      moduleSpecificDebugSettings: this.moduleSpecificDebug,
      debugOverrideSettings: debugOverrideSettings,
    };

    log(false, data);
    return data;
  }

  async _updateObject(ev, formData) {
    const moduleSpecificDebug = game.settings.get(MODULE_ID, MySettings.moduleSpecificDebug);
    const debugOverrides = game.settings.get(MODULE_ID, MySettings.debugOverrides);

    const data = expandObject(formData);

    log(false, {
      formData,
      data,
    });

    const newModuleSpecificDebug = {
      ...moduleSpecificDebug,
    };

    const newDebugOverrides = {
      ...debugOverrides,
      ...data.debugOverrideSettings,
    };

    log(true, 'setting settings', {
      newModuleSpecificDebug,
      newDebugOverrides,
    });

    await game.settings.set(MODULE_ID, MySettings.moduleSpecificDebug, newModuleSpecificDebug);
    await game.settings.set(MODULE_ID, MySettings.debugOverrides, newDebugOverrides);

    this.close();
  }
}
