import { DevMode } from '../classes/DevMode.mjs';

/**
 * Types that exist in the template.
 */
const templateTypes = ['Actor', 'Item'];
/**
 * Keys to ignore in the final report
 */
const ignoreReportKeys = ['used'];

/**
 * Unique array push.
 */
const uniquePush = (value, array) => {
  if (!array.includes(value)) array.push(value);
};

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

  for (const tt of templateTypes) {
    // Fill reportData defaults
    for (const rk of Object.keys(reportData)) {
      reportData[rk][tt] = [];
      reportData[rk]._total = 0;
    }

    // Collect data
    const registeredSubtypes = game.system.entityTypes[tt]; // Registered types
    const templateData = template[tt]; // ex. Actor
    const templateSubtypes = templateData.types; // ex. Actor.types
    for (const d of registeredSubtypes) {
      if (!templateSubtypes.includes(d))
        uniquePush(d, reportData.untemplated[tt]);
    }
    for (const d of templateSubtypes) {
      if (!registeredSubtypes.includes(d))
        uniquePush(d, reportData.unregistered[tt]);

      for (const ttt of templateData[d].templates) { // ex. Actor.type.templates.*
        // Check for used or undefined templates
        if (ttt in templateData.templates)
          uniquePush(ttt, reportData.used[tt]);
        else
          uniquePush(ttt, reportData.undefined[tt]);
      }
    }

    // Check for unused templates
    for (const ttd2 of Object.keys(templateData.templates)) {
      if (!reportData.used[tt].includes(ttd2))
        uniquePush(ttd2, reportData.unused[tt]);
    }
  }

  // Print report
  console.group('template.json report');
  for (const tt of templateTypes) {
    console.group(tt);
    for (const cat of Object.keys(reportData)) {
      if (ignoreReportKeys.includes(cat)) continue;
      const rd = reportData[cat][tt];
      if (rd.length === 0) continue;
      console.log(cat, ':', rd);
    }

    console.groupEnd();
  }
  console.groupEnd();

  const problems = templateTypes
    .reduce((total, tt) => {
      const s = Object.keys(reportData)
        .reduce((stotal, cat) => {
          const ss = reportData[cat][tt].length;
          reportData[cat]._total += ss;
          return ss + stotal;
        }, 0);
      return s + total;

    }, 0);

  if (problems > 0) {
    for (let ignore of ignoreReportKeys)
      delete reportData[ignore];

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
