// SPDX-License-Identifier: MIT
// Copyright © 2021 fvtt-lib-wrapper Rui Pinheiro

'use strict';

// A shim for the libWrapper library
export let libWrapper = undefined;

Hooks.once('init', () => {
  // Check if the real module is already loaded - if so, use it
  if (globalThis.libWrapper && !(globalThis.libWrapper.is_fallback ?? true)) {
    libWrapper = globalThis.libWrapper;
    return;
  }

  // Fallback implementation
  libWrapper = class {
    static get is_fallback() {
      return true;
    }

    static register(package_id, target, fn, type = 'MIXED', { chain = undefined } = {}) {
      const is_setter = target.endsWith('#set');
      target = !is_setter ? target : target.slice(0, -4);
      const split = target.split('.');
      const fn_name = split.pop();
      const root_nm = split.splice(0, 1)[0];
      const _eval = eval; // The browser doesn't expose all global variables (e.g. 'Game') inside globalThis, but it does to an eval. We copy it to a variable to have it run in global scope.
      const obj = split.reduce((x, y) => x[y], globalThis[root_nm] ?? _eval(root_nm));

      let iObj = obj;
      let descriptor = null;
      while (iObj) {
        descriptor = Object.getOwnPropertyDescriptor(iObj, fn_name);
        if (descriptor) break;
        iObj = Object.getPrototypeOf(iObj);
      }
      if (!descriptor || descriptor?.configurable === false)
        throw `libWrapper Shim: '${target}' does not exist, could not be found, or has a non-configurable descriptor.`;

      let original = null;
      const wrapper =
        chain ?? type != 'OVERRIDE'
          ? function () {
              return fn.call(this, original.bind(this), ...arguments);
            }
          : function () {
              return fn.apply(this, arguments);
            };

      if (!is_setter) {
        if (descriptor.value) {
          original = descriptor.value;
          descriptor.value = wrapper;
        } else {
          original = descriptor.get;
          descriptor.get = wrapper;
        }
      } else {
        if (!descriptor.set) throw `libWrapper Shim: '${target}' does not have a setter`;
        original = descriptor.set;
        descriptor.set = wrapper;
      }

      descriptor.configurable = true;
      Object.defineProperty(obj, fn_name, descriptor);
    }
  };

  //************** USER CUSTOMIZABLE:
  // Whether to warn GM that the fallback is being used
  const WARN_FALLBACK = true;

  // Set up the ready hook that shows the "libWrapper not installed" warning dialog
  if (WARN_FALLBACK) {
    //************** USER CUSTOMIZABLE:
    // Package ID & Package Title - by default attempts to auto-detect, but you might want to hardcode your package ID and title here to avoid potential auto-detect issues
    const [PACKAGE_ID, PACKAGE_TITLE] = (() => {
      //@ts-ignore
      const match = (import.meta?.url ?? Error().stack)?.match(/\/(worlds|systems|modules)\/(.+)(?=\/)/i);
      if (match?.length !== 3) return [null, null];
      const dirs = match[2].split('/');
      if (match[1] === 'worlds')
        //@ts-ignore
        return dirs.find((n) => n && game.world.id === n) ? [game.world.id, game.world.title] : [null, null];
      if (match[1] === 'systems')
        return dirs.find((n) => n && game.system.id === n) ? [game.system.id, game.system.data.title] : [null, null];
      const id = dirs.find((n) => n && game.modules.has(n));
      //@ts-ignore
      return [id, game.modules.get(id)?.data?.title];
    })();

    if (!PACKAGE_ID || !PACKAGE_TITLE) {
      console.error(
        'libWrapper Shim: Could not auto-detect package ID and/or title. The libWrapper fallback warning dialog will be disabled.'
      );
      return;
    }

    Hooks.once('ready', () => {
      // Dialog code
      console.warn(`${PACKAGE_TITLE}: libWrapper not present, using fallback implementation.`);
    });
  }
});
