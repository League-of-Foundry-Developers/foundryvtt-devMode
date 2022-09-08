import { DevMode } from '../classes/DevMode.mjs';

/**
 * Has to be patched manually.
 */
export default function setupDisableTemplateCache() {
  const _getTemplate = getTemplate;

  /**
   * Prevents documentSheets, actorSheets, itemSheets from having their
   * templates cached. Allowing these to refresh every time the sheet
   * is rendered.
   * AKA: Poor Man's Hot-Reload
   */
  async function _devModeGetTemplate(path, ...args) {
    // eslint-disable-next-line
    if (_templateCache.hasOwnProperty(path)) {
      DevMode.log(false, 'Deleting cached template: ', path);

      // eslint-disable-next-line
      delete _templateCache[path];
    }

    return _getTemplate(path, ...args);
  }

  // eslint-disable-next-line
  getTemplate = _devModeGetTemplate;
}
