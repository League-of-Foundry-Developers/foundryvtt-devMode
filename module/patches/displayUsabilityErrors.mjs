import { DevMode } from '../classes/DevMode.mjs';

export function _devModeDisplayUsabilityErrors(wrapped) {
  const suppressTooSmall = game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.suppressTooSmall);

  if (suppressTooSmall) {
    // Unsupported Chromium version
    const MIN_CHROMIUM_VERSION = 80;
    const chromium = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    if (chromium && parseInt(chromium[2]) < MIN_CHROMIUM_VERSION) {
      if (ui.notifications) {
        ui.notifications.error(
          game.i18n.format('ERROR.ChromiumVersion', {
            version: chromium[2],
            minimum: MIN_CHROMIUM_VERSION,
          }),
          { permanent: true },
        );
      }
    }
    return;
  }

  wrapped();
}
