import { DevMode } from '../classes/DevMode.mjs';

// Default values to inject into arrays
const injectKeys = {
  packs: {
    private: false
  },
  dependencies: {
    type: "module"
  }
};

// Values to delete from arrays to compensate for diffObject problems
const cullKeys = {
  //packs: ['private']
};

/**
 * @param {String} file File to fetch
 * @param {Object} current Currently loaded data.
 * @param {Function} comparer Custom comparer instead of default diffObject
 */
function fetchData(file, current, comparer) {
  fetch(file, {
    method: 'GET',
    cache: 'no-cache',
    redirect: 'manual'
  }).then(function (response) {
    if (response.ok) response.json().then(data => {
      const result = {
        changed: false,
        details: null
      };
      if (comparer) {
        comparer(file, data, current, result);
      }
      else {
        const diff = diffObject(data, current);
        if (!isObjectEmpty(diff)) {
          result.details = { diff };
          result.changed = true;
        }
      }
      if (result.changed) {
        ui.notifications?.warn(`${file} has changed`, { permanent: true });
        console.warn(`${file} has changed:`, { current: current, fetched: data, details: result.details });
      }
    })
  });
}

/**
 * Culling comparer to deal with diffObject handling arrays poorly.
 */
function culledDiff(file, data, current, result) {
  // HACK: Foundry reformats description quite aggressively. Since it's not important data, we ignore it completely here.
  delete data.description;
  delete current.description;

  // Modify the data to match some automatic reformatting Foundry performs
  const culled = mergeObject(duplicate(current), duplicate(data), { insertKeys: false })
  for (let [key, value] of Object.entries(culled)) {
    if (value instanceof Array) {
      const cullKs = cullKeys[key] ?? [];
      const injectVs = Object.entries(injectKeys[key] ?? {});

      for (let entry of value) {
        // Cull
        for (let cull of cullKs) delete entry[cull];
        // Inject if not present
        for (let [k, v] of injectVs) if (!(k in entry)) entry[k] = v;
      }
    }
  }

  const diff = diffObject(current, culled);
  for (let [key, value] of Object.entries(diff)) {
    if (value instanceof Array) {
      const aDiff = diffObject(value, current[key]);
      if (isObjectEmpty(aDiff)) delete diff[key];
    }
  }

  result.changed = !isObjectEmpty(diff);
  result.details = diff;
}

export function setupJSONDiff() {
  // Test system
  if (game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.jsonDiffSystem)) {
    fetchData(`systems/${game.system.id}/system.json`, duplicate(game.system.data), culledDiff);
    fetchData(`systems/${game.system.id}/template.json`, duplicate(game.system.template));
  }

  // Test modules
  if (game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.jsonDiffModules)) {
    game.modules.forEach(m => {
      if (!m.active) return;
      fetchData(`modules/${m.id}/module.json`, duplicate(m.data), culledDiff);
    })
  }
}
