import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';

export function log(force: boolean, ...args) {
  //@ts-ignore
  if (force || CONFIG[MODULE_ID].debug === true) {
    console.log(MODULE_ID, '|', ...args);
  }
}

export function setDebugOverrides() {
  // set all debug values to match settings
  Object.keys(CONFIG.debug).forEach((debugKey) => {
    if (!!game.settings.get(MODULE_ID, debugKey)) {
      CONFIG.debug[debugKey] = game.settings.get(MODULE_ID, debugKey);
    }
  });
}
