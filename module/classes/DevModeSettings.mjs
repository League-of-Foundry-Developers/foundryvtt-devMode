import { DevMode } from './DevMode.mjs';
import { DevModeConfig } from './DevModeConfig.mjs';

export class DevModeSettings {
  static debouncedReload = foundry.utils.debounce(() => {
    window.location.reload();
  }, 100);

  static booleanSettings = [
    {
      key: DevMode.SETTINGS.overrideConfigDebug,
      onChange: (newValue) => {
        if (!newValue) {
          this.debouncedReload();
          return;
        }
        DevMode.setDebugOverrides();
      },
    },
    { key: DevMode.SETTINGS.suppressTooSmall, default: true },
    { key: DevMode.SETTINGS.alwaysUnpause, default: true },
    {
      key: DevMode.SETTINGS.showChatIds,
      default: true,
      onChange: () => {
        this.debouncedReload();
        return;
      },
    },
    {
      key: DevMode.SETTINGS.showDirectoryIds,
      default: true,
      onChange: () => {
        this.debouncedReload();
        return;
      },
    },
    {
      key: DevMode.SETTINGS.showCompendiumIds,
      default: true,
    },
    {
      key: DevMode.SETTINGS.appHeaderButton,
      default: true,
      onChange: () => {
        this.debouncedReload();
        return;
      },
    },
    {
      key: DevMode.SETTINGS.disableTemplateCache,
      default: false,
      onChange: () => {
        this.debouncedReload();
        return;
      },
    },
    {
      key: DevMode.SETTINGS.jsonDiffSystem,
      default: false,
      onChange: (value) => {
        if (value) this.debouncedReload();
      },
    },
    {
      key: DevMode.SETTINGS.jsonDiffModules,
      default: false,
      onChange: (value) => {
        if (value) this.debouncedReload();
      },
    },
    {
      key: DevMode.SETTINGS.inspectTemplate,
      default: false,
      onChange: (value) => {
        if (value) this.debouncedReload();
      },
    },
  ];

  /**
   * Register all of the Settings and Menu for Dev Mode
   */
  static registerSettings() {
    // register this FormApplication as a settings menu
    game.settings.registerMenu(DevMode.MODULE_ID, 'config-menu', {
      name: `${DevMode.MODULE_ABBREV}.settings.config-menu.Name`,
      label: `${DevMode.MODULE_ABBREV}.settings.config-menu.Label`,
      icon: 'fas fa-cogs',
      type: DevModeConfig,
      restricted: false,
      hint: `${DevMode.MODULE_ABBREV}.settings.config-menu.Hint`,
    });

    // register the setting where we'll store all module specific debug flags
    game.settings.register(DevMode.MODULE_ID, DevMode.SETTINGS.packageSpecificDebug, {
      default: {},
      type: Object,
      scope: 'client',
      config: false,
    });

    // register the setting where we'll store all debug override flags
    game.settings.register(DevMode.MODULE_ID, DevMode.SETTINGS.debugOverrides, {
      default: CONFIG.debug,
      type: Object,
      scope: 'client',
      config: false,
      onChange: () => DevMode.setDebugOverrides(),
    });

    // register the setting where we'll store all compatibility warning Flags
    game.settings.register(DevMode.MODULE_ID, DevMode.SETTINGS.compatibilityWarnings, {
      default: {
        mode: CONST.COMPATIBILITY_MODES?.WARNING ?? 1,
        includePatterns: "",
        excludePatterns: "",
      },
      type: Object,
      scope: 'client',
      config: false,
      onChange: () => DevMode.setCompatibilityWarnings(),
    });

    // register the setting where we'll store all the documents to auto-open
    game.settings.register(DevMode.MODULE_ID, DevMode.SETTINGS.autoOpenDocuments, {
      default: [],
      type: Object,
      scope: 'client',
      config: false,
    });

    this.booleanSettings.forEach(({ key, ...rest }) => {
      game.settings.register(DevMode.MODULE_ID, key, {
        name: `${DevMode.MODULE_ABBREV}.settings.${key}.Name`,
        default: false,
        type: Boolean,
        scope: 'client',
        config: true,
        hint: `${DevMode.MODULE_ABBREV}.settings.${key}.Hint`,
        ...rest,
      });
    });
  }
}
