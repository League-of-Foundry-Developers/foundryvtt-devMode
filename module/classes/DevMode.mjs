import { DevModePerformance } from './DevModePerformance.mjs';

export class DevMode {
  static API = {
    registerPackageDebugFlag: this.registerPackageDebugFlag.bind(this),
    getPackageDebugValue: this.getPackageDebugValue.bind(this),
    runPerformanceTest: DevModePerformance.actorCRUDTest,
  };

  static LogLevel = {
    NONE: 0,
    INFO: 1,
    ERROR: 2,
    DEBUG: 3,
    WARN: 4,
    ALL: 5,
  };

  static MODULE_ID = '_dev-mode';
  static MODULE_ABBREV = 'DEV';

  static SETTINGS = {
    alwaysUnpause: 'always-unpause',
    debugOverrides: 'debug-overrides',
    overrideConfigDebug: 'override-config-debug',
    packageSpecificDebug: 'package-specific-debug',
    compatibilityWarnings: 'compatibility-warnings',
    suppressTooSmall: 'suppress-too-small',
    showDirectoryIds: 'show-directory-ids',
    showCompendiumIds: 'show-compendium-ids',
    appHeaderButton: 'app-header-button',
    showChatIds: 'show-chat-ids',
    disableTemplateCache: 'disable-template-cache',
    jsonDiffSystem: 'json-diff-system',
    jsonDiffModules: 'json-diff-modules',
    inspectTemplate: 'inspect-system-template',
    autoOpenDocuments: 'auto-open-documents'
  };

  static TEMPLATES = {
    settings: `modules/${this.MODULE_ID}/templates/settings.hbs`,
  };

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
  static getPackageDebugValue(packageName, kind = 'boolean') {
    const packageSpecificDebug = game.settings.get(this.MODULE_ID, this.SETTINGS.packageSpecificDebug);

    let relevantFlag = packageSpecificDebug[packageName]?.[kind];

    if (!relevantFlag) {
      throw new Error(`${packageName} does not have a ${kind} debug flag registered`);
    }

    return relevantFlag.value;
  }

  /**
   * A console.log wrapper which checks if we are debugging before logging
   */
  static log(force, ...args) {
    try {
      const shouldLog = force || this.getPackageDebugValue(this.MODULE_ID, 'boolean');

      if (shouldLog) {
        console.log(this.MODULE_ID, '|', ...args);
      }
    } catch (e) {
      console.error(e.message);
    }
  }

  /**
   * A helper to style the log output more nicely
   * @param {*} object
   */
  static fancyLog(object) {
    const label = `%c🧙 Dev Mode | ${object.constructor.name}`;
    console.group(label, 'font-size: 1.4em');
    console.dir(object);
    console.groupEnd(label);

    ui.notifications.notify('Printed to Console', 'success');
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
  static async registerPackageDebugFlag(packageName, kind = 'boolean', options) {
    try {
      if (!packageName) {
        throw new Error('_dev-mode | You must specify package name when registering a debugFlag');
      }

      if (!['boolean', 'level'].includes(kind)) {
        throw new Error(`_dev-mode | Unknown flag kind, you provided "${kind}", expected either "boolean" or "level".`);
      }

      if (kind === 'boolean' && options?.default && typeof options.default !== 'boolean') {
        throw new Error(
          `_dev-mode | A boolean flag must have a boolean default, you provided a ${typeof options.default}`,
        );
      }

      if (kind === 'level' && options?.default && typeof options.default !== 'number') {
        throw new Error(
          `_dev-mode | A level flag must have a LogLevel default, you provided a ${typeof options.default}`,
        );
      }

      const packageSpecificDebug = game.settings.get(this.MODULE_ID, this.SETTINGS.packageSpecificDebug);

      const defaultValue = options?.default ?? kind === 'boolean' ? false : this.LogLevel.NONE;

      const newEntry = {
        [packageName]: {
          [kind]: { packageName, kind, value: defaultValue, choiceLabelOverrides: options?.choiceLabelOverrides },
        },
      };

      const newPackageSpecificDebug = mergeObject(packageSpecificDebug, newEntry, {
        inplace: false,
        insertKeys: true,
        insertValues: true,
        overwrite: false,
        recursive: true,
      });

      this.log(false, {
        newEntry,
        packageSpecificDebug,
        newPackageSpecificDebug,
      });

      this.log(true, `Registering ${kind} flag for ${packageName} with default value of ${defaultValue}`);

      await game.settings.set(this.MODULE_ID, this.SETTINGS.packageSpecificDebug, newPackageSpecificDebug);
      return true;
    } catch (e) {
      console.warn(this.MODULE_ID, e);
      return false;
    }
  }

  /**
   * Sets CONFIG.debug value to match the override stored in settings
   */
  static setDebugOverrides() {
    if (!game.settings.get(this.MODULE_ID, this.SETTINGS.overrideConfigDebug)) {
      this.log(false, 'doing nothing in setDebugOverrides');
      return;
    }

    const debugOverrideSettings = game.settings.get(this.MODULE_ID, this.SETTINGS.debugOverrides);

    // set all debug values to match settings
    Object.keys(CONFIG.debug).forEach((debugKey) => {
      const relevantSetting = debugOverrideSettings[debugKey];

      // only override booleans to avoid conflicts with other modules
      if (relevantSetting !== undefined && typeof relevantSetting === 'boolean') {
        CONFIG.debug[debugKey] = relevantSetting;
      }

      this.log(false, 'setDebugOverride', debugKey, 'to', relevantSetting);
    });
  }

  /**
   * Sets CONFIG.compatibility value to match the value stored in settings
   */
  static setCompatibilityWarnings() {
	const compatibilityWarnings = game.settings.get(this.MODULE_ID, this.SETTINGS.compatibilityWarnings);
	if (isObjectEmpty(compatibilityWarnings) || !CONFIG.compatibility) return;

    // set all compatibility values to match settings
    CONFIG.compatibility.mode = compatibilityWarnings.mode;
    CONFIG.compatibility.includePatterns = compatibilityWarnings.includePatterns
	  ?.split(',')
	  .filter(s => String(s))
	  .map(s => new RegExp(s.trim()));
	CONFIG.compatibility.excludePatterns = compatibilityWarnings.excludePatterns
	  ?.split(',')
	  .filter(s => String(s))
	  .map(s => new RegExp(s.trim()));

	this.log(false, 'setCompatibilityWarnings', compatibilityWarnings);
  }
}
