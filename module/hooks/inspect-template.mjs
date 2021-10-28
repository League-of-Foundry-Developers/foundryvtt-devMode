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
  for (const category of Object.keys(reportData)) {
      for (const type of templateTypes)
        reportData[category][type] = new Set();
      reportData[category]._total = 0;
      reportData[category]._label = `DEV.template-json-report.${category}.Label`;
      reportData[category]._hint = `DEV.template-json-report.${category}.Hint`;
    }

  // Collect and cross-reference data
  for (const type of templateTypes) {
    const templateData = template[type]; // ex. Actor
    const templateSubtypes = templateData.types; // ex. Actor.types
    const registeredSubtypes = game.system.entityTypes[type]; // Registered types
    for (const registeredSubtype of registeredSubtypes) {
      if (!templateSubtypes.includes(registeredSubtype))
        reportData.untemplated[type].add(registeredSubtype);
    }
    for (const templateSubtype of templateSubtypes) {
      //
      if (!registeredSubtypes.includes(templateSubtype))
        reportData.unregistered[type].add(templateSubtype);

      for (const includedSubTemplate of templateData[templateSubtype].templates) { // ex. Actor.type.templates.*
        // Check for used or undefined templates
        if (includedSubTemplate in templateData.templates)
          reportData.used[type].add(includedSubTemplate);
        else
          reportData.undefined[type].add(includedSubTemplate);
      }
    }
  }

  // Check for unused templates
  for (const type of templateTypes) {
    for (const subTemplateName of Object.keys(template[type].templates)) {
      if (!reportData.used[type].has(subTemplateName))
        reportData.unused[type].add(subTemplateName);
    }
  }

  // Print basic report to console
  console.group('template.json report');
  for (const type of templateTypes) {
    console.group(type);
    for (const category of Object.keys(reportData)) {
      if (ignoreReportKeys.includes(category)) continue;
      const reportSet = reportData[category][type];
      if (reportSet.size === 0) continue;
      console.log(category, ':', reportSet);
    }
    console.groupEnd();
  }
  console.groupEnd();

  // Clear some keys for dialog report
  for (let ignore of ignoreReportKeys)
    delete reportData[ignore];

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
