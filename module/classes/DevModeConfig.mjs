import { DevMode } from './DevMode.mjs';
import { DevModePerformance } from './DevModePerformance.mjs';

export class DevModeConfig extends FormApplication {
  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      classes: ['dev-mode-config'],
      closeOnSubmit: false,
      height: 'auto',
      submitOnChange: false,
      submitOnClose: false,
      tabs: [
        {
          navSelector: '.tabs',
          contentSelector: '.main-content',
          initial: 'config',
        },
      ],
      title: game.i18n.localize(`${DevMode.MODULE_ABBREV}.configMenu.FormTitle`),
      width: 400,
      resizable: true,
    };
  }

  get template() {
    return DevMode.TEMPLATES.settings;
  }

  get packageSpecificDebug() {
    return game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.packageSpecificDebug);
  }

  get debugOverrides() {
    return game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.debugOverrides);
  }

  get compatibilityWarnings() {
    const settings = game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.compatibilityWarnings)
    return isObjectEmpty(settings) ? CONFIG.compatibility ?? {} : settings;
  }

  get autoOpenDocuments() {
    return game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.autoOpenDocuments);
  }

  /**
   * A helper to generate the names and hints of any debug key which has those defined
   *
   * @param debugKey - which debug setting we want a translation for
   * @param translation - either "Name" or "Hint"
   */
  static localizeWithFallback(debugKey, translation) {
    const localizationKey = `${DevMode.MODULE_ABBREV}.settings.${debugKey}.${translation}`;
    const hasTranslation = game.i18n.has(localizationKey);

    if (hasTranslation) {
      return game.i18n.localize(localizationKey);
    }

    if (translation === 'Name') {
      return debugKey;
    }

    return undefined;
  }

  getData() {
    const debugOverrideFormData = Object.keys(CONFIG.debug).map((debugKey) => {
      switch (typeof CONFIG.debug[debugKey]) {
        case 'boolean': {
          return {
            name: DevModeConfig.localizeWithFallback(debugKey, 'Name'),
            hint: DevModeConfig.localizeWithFallback(debugKey, 'Hint'),
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
    const packageSpecificDebugFormData = Object.keys(this.packageSpecificDebug).reduce(
      (acc, packageName) => {
        try {
          // don't do anything if it is devMode itself
          if (packageName === DevMode.MODULE_ID) {
            return acc;
          }

          // get the packageData like title

          let relevantPackageData;

          if (game.system.id === packageName) {
            relevantPackageData = game.system.data;
          } else {
            if (!game.modules.get(packageName)?.active) {
              return acc;
            }
            relevantPackageData = game.modules.get(packageName).data;
          }

          // manipulate the data to look like a ClientSetting

          Object.keys(this.packageSpecificDebug[packageName]).forEach((type) => {
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
                    0: relevantFlag.choiceLabelOverrides?.[0] ?? 'DEV.LogLevels.0',
                    1: relevantFlag.choiceLabelOverrides?.[1] ?? 'DEV.LogLevels.1',
                    2: relevantFlag.choiceLabelOverrides?.[2] ?? 'DEV.LogLevels.2',
                    3: relevantFlag.choiceLabelOverrides?.[3] ?? 'DEV.LogLevels.3',
                    4: relevantFlag.choiceLabelOverrides?.[4] ?? 'DEV.LogLevels.4',
                    5: relevantFlag.choiceLabelOverrides?.[5] ?? 'DEV.LogLevels.5',
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

          DevMode.log(false, 'packageSpecificDebugSetting', {
            packageFlagKey: packageName,
            packageSpecificDebug: this.packageSpecificDebug,
            relevantPackageData,
          });

          return acc;
        } catch (e) {
          DevMode.log(true, e);
          return acc;
        }
      },
      { boolean: [], level: [] },
    );

    // Add DevMode to the end of the list
    const devModeData = game.modules.get(DevMode.MODULE_ID).data;

    packageSpecificDebugFormData.boolean.push({
      name: devModeData.title,
      value: this.packageSpecificDebug[DevMode.MODULE_ID]['boolean'].value,
      scope: 'packageSpecificDebugFormData',
      key: `${DevMode.MODULE_ID}.boolean.value`,
      isCheckbox: true,
    });

    const compatibilityWarningsData = {
      enabled: game.release.generation >= 10,
      modes: CONST.COMPATIBILITY_MODES,
      ...this.compatibilityWarnings,
    };

    const data = {
      ...super.getData(),
      packageSpecificDebugFormData,
      debugOverrideFormData,
      overrideConfigDebug: game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.overrideConfigDebug),
      actorTypes: game.system.template.Actor.types.reduce((types, type) => {
        types[type] = `ACTOR.Type${type.capitalize()}`;
        return types;
      }, {}),
      autoOpenDocuments: this.autoOpenDocuments,
      documentsWithSheets: CONST.DOCUMENT_TYPES.filter(x => Object.values(CONFIG[x].sheetClasses)
        .find(sc => !foundry.utils.isObjectEmpty(sc)))
        .reduce((types, type) => { types[type] = type; return types; }, {}),
      compatibilityWarningsData,
    };

    DevMode.log(false, data, {
      debugOverrides: this.debugOverrides,
      packageSpecificDebug: this.packageSpecificDebug,
      compatibilityWarnings: this.compatibilityWarnings,
      autoOpenDocuments: this.autoOpenDocuments,
    });
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('button').on('click', async (event) => {
      if (event.currentTarget?.dataset?.action === 'reset') {
        await game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.packageSpecificDebug, {});
        await game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.debugOverrides, CONFIG.debug);
        await game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.compatibilityWarnings, {});
        window.location.reload();
      }

      if (event.currentTarget.className === 'perf-action') {
        event.preventDefault();

        switch (event.currentTarget?.dataset?.action) {
          case 'actorCRUD': {
            const formData = expandObject(new FormDataExtended(event.currentTarget.closest('form')).toObject());
            return DevModePerformance.actorCRUDTest(formData.actorCrud);
          }
          default:
            return;
        }
      }

      if (event.currentTarget?.dataset?.action === "addAutoOpen" || event.currentTarget?.dataset?.action === "deleteAutoOpen") {
        event.preventDefault();
        const isDeleting = event.currentTarget?.dataset?.action === "deleteAutoOpen";
        const type = event.currentTarget.parentElement.querySelector('[name="autoOpen.type"]').value;
        const id = event.currentTarget.parentElement.querySelector('[name="autoOpen.id"]').value;
        const element = { type, id };
        let autoOpen = [...this.autoOpenDocuments];
        if ( isDeleting ) {
          autoOpen = autoOpen.filter(x => !(x.type == element.type && x.id == element.id));
        }
        else autoOpen.push(element);
        game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.autoOpenDocuments, autoOpen);
        this.render();
      }
    });
  }

  async _updateObject(ev, formData) {
    const { packageSpecificDebugFormData, debugOverrideFormData, overrideConfigDebug, compatibilityWarnings } = expandObject(formData);

    DevMode.log(false, {
      formData,
      data: { packageSpecificDebugFormData, debugOverrideFormData, overrideConfigDebug, compatibilityWarnings },
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

		const newCompatibilityWarnings = mergeObject(this.compatibilityWarnings, compatibilityWarnings, {
			inplace: false,
			insertKeys: true,
			insertValues: true,
			overwrite: true,
			recursive: true,
		});

    DevMode.log(true, 'setting settings', {
      newPackageSpecificDebug,
      newDebugOverrides,
      newCompatibilityWarnings,
    });

    await game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.overrideConfigDebug, overrideConfigDebug);
    await game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.packageSpecificDebug, newPackageSpecificDebug);
    await game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.debugOverrides, newDebugOverrides);
    await game.settings.set(DevMode.MODULE_ID, DevMode.SETTINGS.compatibilityWarnings, newCompatibilityWarnings);

    this.close();
  }
}
