import { ModuleSpecificDebugFlag } from '../../devModeTypes';
import { MODULE_ABBREV, MODULE_ID, MySettings, TEMPLATES, LogLevel } from '../constants';
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
    game.settings.register(MODULE_ID, MySettings.packageSpecificDebug, {
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
    return game.settings.get(MODULE_ID, MySettings.packageSpecificDebug) as Record<
      string,
      ModuleSpecificDebugFlag<'boolean'> | ModuleSpecificDebugFlag<'level'>
    >;
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

    const moduleSpecificDebugSettings = Object.keys(this.moduleSpecificDebug).reduce((acc, moduleFlagKey) => {
      try {
        const flag = this.moduleSpecificDebug[moduleFlagKey];

        if (!flag) {
          throw Error(`Error retreiving module specific debug settings for ${moduleFlagKey}`);
        }

        const relevantFlag = DevModeConfig.getPackageDebug(flag.packageName, flag.kind);

        let relevantPackageData;

        if (game.system.id === relevantFlag.packageName) {
          relevantPackageData = game.system;
        } else {
          relevantPackageData = game.modules.get(relevantFlag.packageName).data as { title?: string; name: string };
        }

        log(false, 'moduleSpecificDebugSetting', {
          moduleFlagKey,
          moduleSpecificDebug: this.moduleSpecificDebug,
          relevantFlag,
          relevantPackageData,
        });

        // every package gets 1 logLevel OR 1 boolean flag
        switch (relevantFlag.kind) {
          case 'boolean': {
            acc[flag.packageName] = {
              name: game.i18n.format(`${MODULE_ID}.configMenu.DebugMode`, {
                package: `${relevantPackageData.title ?? relevantPackageData.name}`,
              }),
              value: relevantFlag.value,
              scope: 'moduleSpecificDebug',
              key: moduleFlagKey,
              isCheckbox: true,
            };
            break;
          }
          case 'level': {
            acc[flag.packageName] = {
              name: game.i18n.format(`${MODULE_ID}.configMenu.LogLevel`, {
                package: `${relevantPackageData.title ?? relevantPackageData.name}`,
              }),
              value: relevantFlag.value,
              key: moduleFlagKey,
              scope: 'moduleSpecificDebug',
              min: LogLevel.NONE,
              max: LogLevel.ALL,
              isRange: true,
            };
            break;
          }
          default: {
            throw Error(`Did not register flag for unknown flag kind.`);
          }
        }

        return acc;
      } catch (e) {
        log(true, e);
        return acc;
      }
    }, {});

    const data = {
      ...super.getData(),
      moduleSpecificDebugSettings: moduleSpecificDebugSettings,
      debugOverrideSettings: debugOverrideSettings,
    };

    log(false, data, {
      debugOverrides: this.debugOverrides,
      moduleSpecificDebug: this.moduleSpecificDebug,
    });
    return data;
  }

  async _updateObject(ev, formData) {
    const moduleSpecificDebug = game.settings.get(MODULE_ID, MySettings.packageSpecificDebug);
    const debugOverrides = game.settings.get(MODULE_ID, MySettings.debugOverrides);

    const data = expandObject(formData);

    log(false, {
      formData,
      data,
    });

    const newPackageSpecificDebug = {
      ...moduleSpecificDebug,
    };

    const newDebugOverrides = {
      ...debugOverrides,
      ...data.debugOverrideSettings,
    };

    log(true, 'setting settings', {
      newPackageSpecificDebug,
      newDebugOverrides,
    });

    await game.settings.set(MODULE_ID, MySettings.packageSpecificDebug, newPackageSpecificDebug);
    await game.settings.set(MODULE_ID, MySettings.debugOverrides, newDebugOverrides);

    this.close();
  }

  /**
   * Register a new module specific debug flag
   *
   * @param {string} package   The namespace under which the flag is registered
   * @param {'boolean' | 'level'} kind      The kind of debug flag
   * @param {Object} options     Configuration for setting data
   * @param {boolean | LogLevel} options.default     Default value for this flag
   *
   * @example
   * // Register a boolean flag
   * DevModeConfig.registerPackageDebugFlag("myPackage", "boolean", {
   *   default: false,
   * });
   *
   * @example
   * // Register a log level
   * DevModeConfig.registerPackageDebugFlag("myPackage", "level", {
   *   default: 0,
   * });
   */
  static async registerPackageDebugFlag(
    packageName: string,
    kind: 'boolean' | 'level',
    options?: {
      default?: boolean | LogLevel;
    }
  ) {
    if (!packageName || !kind) {
      throw new Error('You must specify both package and kind portions of the debugFlag');
    }

    if (kind === 'boolean' && options?.default && typeof options.default !== 'boolean') {
      throw new Error(`A boolean flag must have a boolean default, you provided a ${typeof options.default}`);
    }

    if (kind === 'level' && options?.default && typeof options.default !== 'number') {
      throw new Error(`A level flag must have a LogLevel default, you provided a ${typeof options.default}`);
    }

    const packageSpecificDebug = game.settings.get(MODULE_ID, MySettings.packageSpecificDebug);

    const newPackageSpecificDebug = {
      ...packageSpecificDebug,
      [`${packageName}.${kind}`]: {
        packageName,
        kind,
        value: options?.default ?? kind === 'boolean' ? false : LogLevel.NONE,
      },
    };

    return await game.settings.set(MODULE_ID, MySettings.packageSpecificDebug, newPackageSpecificDebug);
  }

  /**
   * Get a package specific debug field
   *
   * @param {string} packageName   The namespace under which the flag is registered
   * @param {'boolean' | 'level'} kind      The kind of debug flag
   *
   * @example
   * // Get a boolean flag
   * const isDebugging = DevModeConfig.getPackageDebug("myPackage", "boolean");
   *
   * @example
   * // Get a log level
   * const debugLevel = DevModeConfig.getPackageDebug("myPackage", "level");
   */
  static getPackageDebug(packageName: string, type: 'boolean' | 'level') {
    const packageSpecificDebug = game.settings.get(MODULE_ID, MySettings.packageSpecificDebug);

    let relevantFlag: ModuleSpecificDebugFlag<'boolean'> | ModuleSpecificDebugFlag<'level'> =
      packageSpecificDebug[`${packageName}.${type}`];

    if (!relevantFlag) {
      throw new Error(`${packageName} does not have a ${type} debug flag registered`);
    }

    return relevantFlag;
  }
}
