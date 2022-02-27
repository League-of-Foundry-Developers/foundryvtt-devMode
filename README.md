# 🧙 Developer Mode

![Developer Mode](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FLeague-of-Foundry-Developers%2Fleague-repo-status%2Fshields-endpoint%2F_dev-mode.json)
![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FLeague-of-Foundry-Developers%2Ffoundryvtt-devMode%2Freleases%2Flatest)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2F_dev-mode&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=_dev-mode)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2F_dev-mode%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/_dev-mode/)
[![Foundry Hub Comments](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2F_dev-mode%2Fshield%2Fcomments)](https://www.foundryvtt-hub.com/package/_dev-mode/)
![Supported Foundry Versions](https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https://github.com/League-of-Foundry-Developers/foundryvtt-devMode/releases/latest/download/module.json)

A swiss army knife for development tooling in Foundry VTT.

## Features

- Provides a UI to toggle any Foundry Core CONFIG.debug flags, persisting the selection in the user's client settings.
- Provides an API to register and read a "debug mode flag" which is either a boolean or a number from 0 to 5 (log level).
- Provides a UI to toggle these flags on and off, preserving this selection in the user's client settings.
- Provides a button to copy and print documents to console.
- Provides some utilities to detect JSON configuration changes or errors.
- Allows developer to disable the template cache for a "poor man's hot reload" for handlebars files.

![Demo of the Core Config overrides.](docs/debug-mode-core-config.png)

### Goal

Enable developers to stop putting debug code in their module code which accidentally gets shipped.
Empower developers with commonly sought-after QOL features.

## TODO

1. Leverage the potential future `CONFIG.debug.moduleDebug` flag.
1. Implement other developer tooling. Have an idea? [Leave a suggestion!](https://github.com/League-of-Foundry-Developers/foundryvtt-devMode/issues/new?assignees=&labels=enhancement%2C+suggestion&template=feature_request.md&title=)

## Installation

Module JSON:

```
https://github.com/League-of-Foundry-Developers/foundryvtt-devMode/releases/latest/download/module.json
```

## Configuration

| **Name**                      | Description                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Override CONFIG.debug?        | Whether or not to use the dev-mode override settings for CONFIG.debug flags.                                         |
| Suppress Window Size Warning  | Suppresses the window size warning on startup.                                                                       |
| Always Unpause                | The game will always unpause when starting.                                                                          |
| Show Chat Message Ids?        | Places a clickable chip on chat messages to copy the id or print the document to the console.                        |
| Show Sidebar Directory Ids?   | Places a clickable chip on sidebar directory entries to copy the id or print the document to the console.            |
| Show Compendium Document Ids? | Places a clickable chip on compendium directory entries to copy the id.                                              |
| Show App Header Button?       | Places a Header Button on document sheets and compendium displays to print the document to the console.              |
| Disable Template Cache?       | Disables the Foundry Core template cache, allowing any template changes to be picked up when `getTemplate` is rerun. |
| System JSON Changes (#21)     | Notify about system.json and template.json changes.                                                                  |
| Module JSON changes (#21)     | Notify about module.json changes on any and all active modules.                                                      |
| Inspect template.json (#25)   | Does basic checks on template.json for potential issues on load.                                                     |

## API

While active, after the hook `devModeReady` is fired, the following api methods are expected to be on `game.modules.get('_dev-mode')?.api`:

### `registerPackageDebugFlag`

```ts
async registerPackageDebugFlag(
  packageName: string,
  kind?: 'boolean' | 'level',
  options?: {
    default?: boolean | LogLevel;
    choiceLabelOverrides?: Record<number, string>;
  }
): Promise<boolean>
```

- `kind` defaults to `'boolean'`
- `options.default` is either `false` or `0` by default, depending on the `kind`
- `options.choiceLabelOverrides` allows an object to be passed which overrides the choice labels for a given level (0 - 5). The provided string will be run through `localize`.
- Returns a promise which resolves true or false depending on if successful.

#### `choiceLabelOverrides` Example

```js
registerPackageDebugFlag('my-module-id', 'level', {
  choiceLabelOverrides: {
    0: 'Foo',
    1: 'Bar',
    2: 'Bat',
    3: 'Biz',
    4: 'Bin',
    5: 'Bam',
  },
});
```

### `getPackageDebugValue`

```ts
getPackageDebugValue(
  packageName: string,
  kind?: 'boolean' | 'level',
): boolean | LogLevel
```

- `kind` defaults to `'boolean'`
- Returns the current value of your debug flag

## How do I actually use this?

### Step 1: Register your debug flag

If all you want is a simple boolean, this is as simple as doing this in your module's js:

```js
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag('my-module-id');
});
```

### Step 2: Read that value

Here's a log function I use which allows me to toggle on all of the stupid little logs I leave all over the place while I'm debugging.

```js
const MODULE_ID = 'my-module-id';

function log(force: boolean, ...args) {
  try {
    const isDebugging = game.modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_ID);

    if (force || isDebugging) {
      console.log(MODULE_ID, '|', ...args);
    }
  } catch (e) {}
}

// ...

log(false, someVarToLog); // won't log unless my debug value is true
```

## Known ~~Issues~~ Features

- Any module which adds a custom key to `CONFIG.debug` will have that key show up in the `CONFIG.debug` overrides setting section.

## Typescript Definitions

This is an example typescript definition which would be accurate for the DevMode API available on `game.modules.get('_dev-mode')?.api` and provided as the argument to `devModeReady`'s callbacks.

```ts
enum LogLevel {
  NONE = 0,
  INFO = 1,
  ERROR = 2,
  DEBUG = 3,
  WARN = 4,
  ALL = 5,
}

interface DevModeApi {
  registerPackageDebugFlag(packageName: string, kind?: "boolean" | "level", options?: {
      default?: boolean | LogLevel;
      choiceLabelOverrides?: Record<string, string>; // actually keyed by LogLevel number
  }): Promise<boolean>;

  getPackageDebugValue(packageName: string, kind?: "boolean" | "level"): boolean | LogLevel;
}
```

## Acknowledgements

Mad props to the [League of Extraordinary FoundryVTT Developers](https://forums.forge-vtt.com/c/package-development/11) community which helped me figure out a lot.

Bootstrapped with [Ghost's Foundry Factory](https://github.com/ghost-fvtt/foundry-factory) then heavily trimmed.
