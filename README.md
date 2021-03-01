# Developer Mode

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FElfFriend-DnD%2Ffoundryvtt-devMode%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdev-mode&colorB=4aa94a)
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FElfFriend-DnD%2Ffoundryvtt-devMode%2Fmain%2Fsrc%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange)
[![ko-fi](https://img.shields.io/badge/-buy%20me%20a%20coke-%23FF5E5B)](https://ko-fi.com/elffriend)
[![patreon](https://img.shields.io/badge/-patreon-%23FF424D)](https://www.patreon.com/ElfFriend_DnD)


A swiss army knife for development tooling in Foundry VTT.

## Features

- Provides a UI to toggle any Foundry Core CONFIG.debug flags, persisting the selection in the user's client settings.
- Provides an API to register and read a "debug mode flag" which is either a boolean or a number from 0 to 5 (log level).
- Provides a UI to toggle these flags on and off, preserving this selection in the user's client settings.

### Goal
Enable developers to stop putting debug code in their module code which accidentally gets shipped.

## TODO

1. Leverage the potential future `CONFIG.debug.moduleDebug` flag.
1. Implement other developer tooling. Have an idea? [Leave a suggestion!]()

## Installation

Module JSON:

```
https://github.com/ElfFriend-DnD/foundryvtt-devMode/releases/latest/download/module.json
```

## Configuration

| **Name**               | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| Override CONFIG.debug? | Whether or not to use the dev-mode override settings for CONFIG.debug flags. |


## API

While active, after the hook `devModeReady` is fired, the following api methods are expected to be on `window.DEV`:

### `registerPackageDebugFlag`

```ts
async registerPackageDebugFlag(
  packageName: string,
  kind?: 'boolean' | 'level',
  options?: {
    default?: boolean | LogLevel;
  }
): Promise<boolean>
```

- `kind` defaults to `'boolean'`
- `options.default` is either `false` or `0` by default, depending on the `kind`
- Returns a promise which resolves true or false depending on if successful.

### `getPackageDebug`

```ts
getPackageDebug(
  packageName: string,
  kind?: 'boolean' | 'level',
): boolean | LogLevel
```

- `kind` defaults to `'boolean'`
- Returns the current value of your debug flag



## Known Issues

- This module does not, in fact, exist yet.

## Acknowledgements

Mad props to the [League of Extraordinary FoundryVTT Developers](https://forums.forge-vtt.com/c/package-development/11) community which helped me figure out a lot.

Bootstrapped with Nick East's [create-foundry-project](https://gitlab.com/foundry-projects/foundry-pc/create-foundry-project). Typescript types from [foundry-vtt-types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types).
