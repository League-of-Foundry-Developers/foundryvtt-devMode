export class DevModePerformance {
  constructor() {
    this.loadStart = performance.now();
    this.initMark;
    this.readyMark;
  }

  setInitMark() {
    this.initMark = performance.now();
    return this.initMark;
  }

  setReadyMark() {
    this.readyMark = performance.now();
    return this.readyMark;
  }

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

  static actorCRUDTest = async (iterations = 1000) => {
    console.log('running test with iterations:', `${iterations}`, !!iterations, iterations || 1000);
    const debugConfig = { ...CONFIG.debug };
    this.resetDebug();

    const now = performance.now();
    for (let x = 0; x <= iterations; x++) {
      const created = await Actor.create({
        name: `${x}`,
        type: CONFIG.Actor?.documentClass?.metadata?.types?.[0] ?? 'npc',
      });
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

  static actorCreateTest = async (iterations = 1000) => {
    console.log('running test with iterations:', `${iterations}`, !!iterations, iterations || 1000);
    const debugConfig = { ...CONFIG.debug };
    this.resetDebug();

    const now = performance.now();
    for (let x = 0; x <= iterations; x++) {
      await Actor.create({ name: `${x}`, type: CONFIG.Actor?.documentClass?.metadata?.types?.[0] ?? 'npc' });
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

  static actorCreateTest = async (iterations = 1000) => {
    console.log('running test with iterations:', `${iterations}`, !!iterations, iterations || 1000);
    const debugConfig = { ...CONFIG.debug };
    this.resetDebug();

    const now = performance.now();
    for (let x = 0; x <= iterations; x++) {
      await Actor.create({ name: `${x}`, type: 'npc' });
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
