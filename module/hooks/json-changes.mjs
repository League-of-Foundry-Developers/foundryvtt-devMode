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

const deprecatedKeys = {
  // "systems" key deprecation has special handling.
  packs: {
    entity: "type", // v9 deprecation (entity -> type), v10 incompatible
  }
};

/**
 * Mutates inputs before checking.
 * @param {Object} data
 * @param {Object} result
 */
function preScrubData(data, result) {
  // PackageData constructor handles systems deprecation badly, so it is handled here.
  if (data.systems) {
    data.system = data.systems;
    delete data.systems;
    result.details.deprecations.systems = "system";
  }
}

/**
 * @param {String} file File to fetch
 * @param {SystemData|ModuleData} loadedPkg Currently loaded data.
 * @param {Function} comparer Custom comparer instead of default diffObject
 */
function fetchData(file, current, comparer) {
  const loadedPkg = foundry.utils.deepClone(current);
  fetch(file, {
    method: 'GET',
    cache: 'no-cache',
    redirect: 'manual'
  }).then(function (response) {
    if (response.ok) response.json().then(data => {
      const result = {
        changed: false,
        details: { diff: null, deprecations: {}},
      };
      preScrubData(data, result);
      const cls = loadedPkg.constructor;
      const fetchedPkg = new cls(data);
      if (comparer) {
        comparer(file, fetchedPkg, loadedPkg, result);
      }
      else {
        // Use plain diffObject if no comparer is specified
        const diff = basicPackageDiff(fetchedPkg, loadedPkg);
        if (!isObjectEmpty(diff)) {
          result.details = { diff };
          result.changed = true;
        }
      }
      if (result.changed) {
        ui.notifications?.warn(`${file} has changed`, { permanent: true });
        console.warn(`DEV MODE | ${file} has changed:\n`, { current: loadedPkg, fetched: data, diff: result.details.diff });
      }
      if (result.deprecations) {
        ui.notifications?.warn(`${file} has deprecated keys`, { permanent: true });
        console.warn(`DEV MODE | ${file} has deprecated keys:\n`, result.details.deprecations);
      }
    })
  });
}

function basicPackageDiff(source, target) {
  const diff = diffObject(source, target);
  delete diff.description; // Description is reformatted by Foundry and is likely to mismatch no matter what.
  return diff;
}

/**
 * Comparer to deal with diffObject handling arrays poorly and Foundry filling in some extra data.
 *
 * @param {String} file Filename of the fetched package.
 * @param {PackageData|SystemData|ModuleData} fetchedPkg Fetched package.
 * @param {PackageData|SystemData|ModuleData} loadedPkg Currently loaded package.
 * @param {Object} result Object containing the results
 */
function cullingComparer(file, fetchedPkg, loadedPkg, result = {}) {
  // Modify the data to match some automatic reformatting Foundry performs
  const modified = deepClone(fetchedPkg);
  const deprecations = result.details.deprecations;
  for (let [key, value] of Object.entries(modified)) {
    if (value instanceof Array) {
      const cullKs = cullKeys[key] ?? [];
      const injectVs = Object.entries(injectKeys[key] ?? {});
      const deprKs = Object.entries(deprecatedKeys[key] ?? {});

      for (let entry of value) {
        // Cull
        for (let cull of cullKs) delete entry[cull];
        // Inject if not present
        for (let [k, v] of injectVs) if (!(k in entry)) entry[k] = v;
        // Duplicate deprecated values to match the already loaded state
        for (let [deprecatedK, newK] of deprKs) {
          if (deprecatedK in entry && !(newK in entry)) {
            entry[newK] = entry[deprecatedK];
            if (!deprecations[key]) deprecations[key] = {};
            deprecations[key][deprecatedK] = newK;
          }
        }
      }
    }
  }

  const diff = basicPackageDiff(loadedPkg, modified);

  // Delete unchanged arrays from the diff
  for (let [key, value] of Object.entries(diff)) {
    if (value instanceof Array) {
      const aDiff = diffObject(value, loadedPkg[key]);
      if (isObjectEmpty(aDiff))
        delete diff[key];
    }
  }

  result.changed = !isObjectEmpty(diff);
  result.deprecations = !isObjectEmpty(deprecations);
  result.details = { diff, deprecations };

  return result;
}

export function setupJSONDiff() {
  // Test system
  if (game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.jsonDiffSystem)) {
    fetchData(`systems/${game.system.id}/system.json`, game.system.data, cullingComparer);
    fetchData(`systems/${game.system.id}/template.json`, game.system.template);
  }

  // Test modules
  if (game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.jsonDiffModules)) {
    game.modules.forEach(m => {
      if (!m.active) return;
      fetchData(`modules/${m.id}/module.json`, m.data, cullingComparer);
    })
  }
}
