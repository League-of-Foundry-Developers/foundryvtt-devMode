import { DebugFlagSetting, DebugFlagType, PackageSpecificDebugFlag } from '../../devModeTypes';
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
      onChange: () => setDebugOverrides(),
    });
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

  get packageSpecificDebug() {
    return game.settings.get(MODULE_ID, MySettings.packageSpecificDebug) as Record<
      string,
      Record<DebugFlagType, PackageSpecificDebugFlag<'boolean'> | PackageSpecificDebugFlag<'level'>>
    >;
  }

  get debugOverrides() {
    return game.settings.get(MODULE_ID, MySettings.debugOverrides);
  }

  getData() {
    const debugOverrideFormData = Object.keys(CONFIG.debug).map((debugKey: keyof typeof CONFIG['debug']) => {
      switch (typeof CONFIG.debug[debugKey]) {
        case 'boolean': {
          return {
            name: localizeWithFallback(debugKey, 'Name'),
            hint: localizeWithFallback(debugKey, 'Hint'),
            value: this.debugOverrides[debugKey],
            scope: 'debugOverrideFormData',
            key: debugKey,
            isCheckbox: true,
          };
        }
        default: {
          console.log('Did not register dev-mode setting for unknown config type which was not a boolean:', debugKey);
        }
      }
    });

    // transform from Record<string, PackageSpecificDebugFlag> to Record<DebugFlagType, DebugFlagSetting[]>
    const packageSpecificDebugFormData = Object.keys(this.packageSpecificDebug).reduce<
      Record<DebugFlagType, DebugFlagSetting<DebugFlagType>[]>
    >(
      (acc, packageName: string) => {
        try {
          // don't do anything if it is devMode itself
          if (packageName === MODULE_ID) {
            return acc;
          }

          // get the packageData like title

          let relevantPackageData;

          if (game.system.id === packageName) {
            relevantPackageData = game.system;
          } else {
            relevantPackageData = game.modules.get(packageName).data;
          }

          if (!game.modules.get(packageName).active) {
            return acc;
          }

          // manipulate the data to look like a ClientSetting

          Object.keys(this.packageSpecificDebug[packageName]).forEach((type: DebugFlagType) => {
            const relevantFlag = this.packageSpecificDebug[packageName][type];

            switch (relevantFlag.kind) {
              case 'boolean': {
                acc[relevantFlag.kind].push({
                  name: relevantPackageData.title ?? relevantPackageData.name,
                  value: relevantFlag.value,
                  scope: 'packageSpecificDebugFormData',
                  key: `${packageName}.${type}.value`,
                  isCheckbox: true,
                });
                break;
              }
              case 'level': {
                acc[relevantFlag.kind].push({
                  name: relevantPackageData.title ?? relevantPackageData.name,
                  value: relevantFlag.value,
                  key: `${packageName}.${type}.value`,
                  scope: 'packageSpecificDebugFormData',
                  choices: {
                    0: 'DEV.LogLevels.0',
                    1: 'DEV.LogLevels.1',
                    2: 'DEV.LogLevels.2',
                    3: 'DEV.LogLevels.3',
                    4: 'DEV.LogLevels.4',
                    5: 'DEV.LogLevels.5',
                  },
                  isSelect: true,
                });
                break;
              }
              default: {
                throw Error(`Did not register flag for unknown flag kind.`);
              }
            }
          });

          log(false, 'packageSpecificDebugSetting', {
            packageFlagKey: packageName,
            packageSpecificDebug: this.packageSpecificDebug,
            relevantPackageData,
          });

          return acc;
        } catch (e) {
          log(true, e);
          return acc;
        }
      },
      { boolean: [], level: [] }
    );

    // Add DevMode to the end of the list
    const devModeData = game.modules.get(MODULE_ID).data as any;

    packageSpecificDebugFormData.boolean.push({
      name: devModeData.title,
      value: this.packageSpecificDebug[MODULE_ID]['boolean'].value,
      scope: 'packageSpecificDebugFormData',
      key: `${MODULE_ID}.boolean.value`,
      isCheckbox: true,
    });

    const data = {
      ...super.getData(),
      packageSpecificDebugFormData,
      debugOverrideFormData,
      overrideConfigDebug: game.settings.get(MODULE_ID, MySettings.overrideConfigDebug),
    };

    log(false, data, {
      debugOverrides: this.debugOverrides,
      packageSpecificDebug: this.packageSpecificDebug,
    });
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('button').on('click', async (event) => {
      if (event.currentTarget?.dataset?.action === 'reset') {
        await game.settings.set(MODULE_ID, MySettings.packageSpecificDebug, {});
        await game.settings.set(MODULE_ID, MySettings.debugOverrides, CONFIG.debug);
        window.location.reload();
      }
    });
  }

  async _updateObject(ev, formData) {
    const { packageSpecificDebugFormData, debugOverrideFormData, overrideConfigDebug } = expandObject(formData);

    log(false, {
      formData,
      data: { packageSpecificDebugFormData, debugOverrideFormData, overrideConfigDebug },
    });

    const newPackageSpecificDebug = mergeObject(this.packageSpecificDebug, packageSpecificDebugFormData, {
      inplace: false,
      insertKeys: true,
      insertValues: true,
      overwrite: true,
      recursive: true,
    });

    const newDebugOverrides = mergeObject(this.debugOverrides, debugOverrideFormData, {
      inplace: false,
      insertKeys: true,
      insertValues: true,
      overwrite: true,
      recursive: true,
    });

    log(true, 'setting settings', {
      newPackageSpecificDebug,
      newDebugOverrides,
    });

    await game.settings.set(MODULE_ID, MySettings.overrideConfigDebug, overrideConfigDebug);
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
    kind: 'boolean' | 'level' = 'boolean',
    options?: {
      default?: boolean | LogLevel;
    }
  ) {
    try {
      if (!packageName) {
        throw new Error('You must specify package name when registering a debugFlag');
      }

      if (!['boolean', 'level'].includes(kind)) {
        throw new Error(`Unknown flag kind, you provided "${kind}", expected either "boolean" or "level".`);
      }

      if (kind === 'boolean' && options?.default && typeof options.default !== 'boolean') {
        throw new Error(`A boolean flag must have a boolean default, you provided a ${typeof options.default}`);
      }

      if (kind === 'level' && options?.default && typeof options.default !== 'number') {
        throw new Error(`A level flag must have a LogLevel default, you provided a ${typeof options.default}`);
      }

      const packageSpecificDebug = game.settings.get(MODULE_ID, MySettings.packageSpecificDebug);

      const defaultValue = options?.default ?? kind === 'boolean' ? false : LogLevel.NONE;

      const newEntry = {
        [packageName]: {
          [kind]: { packageName, kind, value: defaultValue },
        },
      };

      const newPackageSpecificDebug = mergeObject(packageSpecificDebug, newEntry, {
        inplace: false,
        insertKeys: true,
        insertValues: true,
        overwrite: false,
        recursive: true,
      });

      log(false, {
        newEntry,
        packageSpecificDebug,
        newPackageSpecificDebug,
      });

      log(true, `Registering ${kind} flag for ${packageName} with default value of ${defaultValue}`);

      await game.settings.set(MODULE_ID, MySettings.packageSpecificDebug, newPackageSpecificDebug);
      return true;
    } catch (e) {
      console.warn(MODULE_ID, e);
      return false;
    }
  }

  /**
   * Get a package specific debug field
   *
   * @param {string} packageName   The namespace under which the flag is registered
   * @param {'boolean' | 'level'} kind      The kind of debug flag
   *
   * @example
   * // Get a boolean flag
   * const isDebugging = DevModeConfig.getPackageDebugValue("myPackage", "boolean");
   *
   * @example
   * // Get a log level
   * const debugLevel = DevModeConfig.getPackageDebugValue("myPackage", "level");
   */
  static getPackageDebugValue(packageName: string, kind: 'boolean' | 'level' = 'boolean') {
    const packageSpecificDebug = game.settings.get(MODULE_ID, MySettings.packageSpecificDebug);

    let relevantFlag: PackageSpecificDebugFlag<'boolean'> | PackageSpecificDebugFlag<'level'> =
      packageSpecificDebug[packageName]?.[kind];

    if (!relevantFlag) {
      throw new Error(`${packageName} does not have a ${kind} debug flag registered`);
    }

    return relevantFlag.value;
  }
}
