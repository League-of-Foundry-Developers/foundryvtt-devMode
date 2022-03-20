export class DevModePerformance {
  static resetDebug() {
    Object.keys(CONFIG.debug).forEach((key) => {
      CONFIG.debug[key] = false;
    });
  }

  static copyToClipboard(toCopy) {
    navigator.permissions.query({ name: 'clipboard-write' }).then((result) => {
      if (result.state == 'granted' || result.state == 'prompt') {
        /* write to the clipboard now */
        navigator.clipboard.writeText(toCopy).then(
          () => ui.notifications.notify(game.i18n.localize('DEV.clipboard.success'), 'success'),
          () => ui.notifications.notify(game.i18n.localize('DEV.clipboard.failed'), 'error'),
        );
      }
    });
  }

  static actorCRUDTest = async (type, iterations = 1000, synthetic) => {
    console.log('running test with iterations:', `${iterations}`, !!iterations, iterations || 1000);
    if (!game.system.template.Actor.types.includes(type)) return console.error(type, "is invalid actor type");
    const debugConfig = { ...CONFIG.debug };
    this.resetDebug();

    const now = performance.now();
    for (let x = 0; x <= iterations; x++) {
      const created = await Actor.create({ name: `${x}`, type }, { temporary: synthetic });
      await created.update({ name: 'Actor' + x });
      await created.delete();
      if (x % 10 == 0) SceneNavigation.displayProgressBar({ label: 'Test Progress', pct: (x / iterations) * 100 });
    }

    const end = performance.now();

    const output = `Total: ${end - now}ms. Per: ${(end - now) / iterations}ms.`;

    // reset config debug
    CONFIG.debug = debugConfig;

    Dialog.prompt({
      content: output,
      title: game.i18n.localize('DEV.configMenu.performance.actorCRUD.label'),
      label: game.i18n.localize('DEV.clipboard.copy'),
      callback: () => this.copyToClipboard(output),
      rejectClose: false,
    });
    console.info(output);
  };
}
