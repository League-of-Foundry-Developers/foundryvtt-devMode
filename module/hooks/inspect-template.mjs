import { DevMode } from '../classes/DevMode.mjs';

/**
 * Types that exist in the template.
 */
const templateTypes = ['Actor', 'Item'];
/**
 * Keys to ignore in the final report
 */
const ignoreReportKeys = ['used'];

export async function inspectSystemTemplate() {
  if (!game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.inspectTemplate)) return;

  const template = game.system.template;
  const reportData = {
    unregistered: {}, // Templated types that lack registration
    untemplated: {}, // Registered types that lack a template
    unused: {}, // Templates that are defined but never used
    undefined: {}, // Templates that are referred to but remain undefined
    used: {}, // Templates that are used.
  };

  // Fill reportData defaults
  Object.keys(reportData).forEach(category => {
    templateTypes.forEach(type => reportData[category][type] = new Set());
    reportData[category]._total = 0;
    reportData[category]._label = `DEV.template-json-report.${category}.Label`;
    reportData[category]._hint = `DEV.template-json-report.${category}.Hint`;
  });

  // Collect and cross-reference data
  templateTypes.forEach(type => {
    const templateData = template[type]; // ex. Actor
    const templateSubtypes = templateData.types; // ex. Actor.types
    // Check if the subtypes have been registered (present in sheetClasses)
    const registeredSubtypes = Object.keys(CONFIG[type].sheetClasses); // Registered types
    registeredSubtypes.forEach(registeredSubtype => {
      if (!templateSubtypes.includes(registeredSubtype))
        reportData.untemplated[type].add(registeredSubtype);
    });
    // Cross-reference otherwise
    templateSubtypes.forEach(templateSubtype => {
      // Test if templated types have registered sheets.
      if (Object.keys(CONFIG[type].sheetClasses[templateSubtype] ?? {}).length === 0)
        reportData.unregistered[type].add(templateSubtype);

      if (templateData[templateSubtype] === undefined) {
        console.warn(type, "subtype", templateSubtype, "lacks definition");
        reportData.untemplated[type].add(templateSubtype);
        return;
      }

      templateData[templateSubtype].templates?.forEach(includedSubTemplate => { // ex. Actor.type.templates.*
        // Check for used or undefined templates
        if (includedSubTemplate in templateData.templates)
          reportData.used[type].add(includedSubTemplate);
        else
          reportData.undefined[type].add(includedSubTemplate);
      });
    });
  });

  // Check for unused templates
  templateTypes
    .forEach(type => Object.keys(template[type].templates)
      .forEach(subTemplateName => {
        if (!reportData.used[type].has(subTemplateName))
          reportData.unused[type].add(subTemplateName);
      })
    );

  // Print basic report to console
  console.group('template.json report');
  templateTypes.forEach(type => {
    console.group(type);
    Object.keys(reportData).forEach(category => {
      if (ignoreReportKeys.includes(category)) return;
      const reportSet = reportData[category][type];
      if (reportSet.size === 0) return;
      console.log(category, ':', reportSet);
    });
    console.groupEnd();
  });
  console.groupEnd();

  // Clear some keys for dialog report
  ignoreReportKeys.forEach(ignore => delete reportData[ignore]);

  // Check if there is actually anything worth reporting after above deletion
  const problems = templateTypes
    .reduce((total, tt) => {
      const s = Object.keys(reportData)
        .reduce((stotal, cat) => {
          const ss = reportData[cat][tt].size;
          reportData[cat]._total += ss;
          return ss + stotal;
        }, 0);
      return s + total;

    }, 0);

  if (problems > 0) {
    new Dialog({
      title: "template.json report",
      content: await renderTemplate("modules/_dev-mode/templates/inspect-template-report.hbs", { data: reportData, types: templateTypes }),
      buttons: {
        dismiss: {
          label: "Dismiss",
          icon: '<i class="fas fa-power-off"></i>'
        }
      },
      default: "dismiss"
    }).render(true);
  }
}
