# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UNRELEASED] - YYYY-MM-DD

### Added
- [#202](https://github.com/equinor/webviz-core-components/pull/202) - Adjusted `z-index` of suggestions of `SmartNodeSelector` to a hard-coded value of `1500`.
- [#201](https://github.com/equinor/webviz-core-components/pull/201) - Implemented wrapper around `MaterialUI's` draggable dialog. Makes a new `Dialog` component available in `Dash`.
- [#210](https://github.com/equinor/webviz-core-components/pull/210) - Added `backdrop` property to `Dialog`. This allows to disable the backdrop behind a dialog and makes all other elements remain clickable.

## [0.5.5] - 2022-02-09

### Changed

- [#197](https://github.com/equinor/webviz-core-components/pull/197) - Updated `@equinor/eds-icons` (and associated `@equinor/eds-core-react` dependencies) in order to use new icons upstream in the application menu.

## [0.5.4] - 2021-12-09

### Fixed

- [#178](https://github.com/equinor/webviz-core-components/pull/178) - Bug fixes in `SmartNodeSelector`: Placeholder not applied, text width not calculated correctly initially, jump to next node when pressing `Enter`, bug fixes and improvements when navigating with arrows. Node names containing `-` were breaking the code.
- [#191](https://github.com/equinor/webviz-core-components/pull/191) - Removed `pointer` cursor from `webviz-selectors` class.

### Added

- [#178](https://github.com/equinor/webviz-core-components/pull/178) - Implemented case-insensitive and description search in `SmartNodeSelector`. 
    Also added export of data types and implemented `OR` operator in nodes as beta feature. Implemented better visual feedback, tab and end/home navigation. Implemented visual feedback and possibility to show all suggestions.

## [0.5.3] - 2021-11-08

### Changed

- [#181](https://github.com/equinor/webviz-core-components/pull/181) - `SmartNodeSelector` suggestions window is now attached at top level of DOM tree. This improves usability when used in a scroll area.

### Fixed

- [#177](https://github.com/equinor/webviz-core-components/pull/177) - Bug fix: Menu missing if using non-existent icon.

### Added

- [#182](https://github.com/equinor/webviz-core-components/pull/182) - Added option to wrap `SelectWithLabel` in a `Details` collapsible widget.
- [#174](https://github.com/equinor/webviz-core-components/pull/174) - Implemented `initiallyCollapsed` setting for menu.

## [0.5.2] - 2021-10-08

### Changed

- [#161](https://github.com/equinor/webviz-core-components/pull/161) - Updated to `Dash 2.0`.
- [#173](https://github.com/equinor/webviz-core-components/pull/173) - Improved menu layout and auto-width.

### Fixed

- [#157](https://github.com/equinor/webviz-core-components/pull/157) - Added utf8 encoding to Python's `open()` calls.
- [#158](https://github.com/equinor/webviz-core-components/pull/158) - Fixed error messages when contact person details not provided to `WebvizPluginPlaceholder`.
- [#159](https://github.com/equinor/webviz-core-components/pull/159) - Call `revokeObjectURL` after using `createObjectURL` in `WebvizPluginPlaceholder`.
- [#160](https://github.com/equinor/webviz-core-components/pull/160) - Bug fix: `Select` property `value` does not return correct type.
- [#172](https://github.com/equinor/webviz-core-components/pull/172) - Bug fix: No margin between plugins.

### Added

- [#154](https://github.com/equinor/webviz-core-components/pull/154) - Implemented new menu component.

## [0.5.1] - 2021-07-12

### Changed

- [#140](https://github.com/equinor/webviz-core-components/pull/140) - Improved styling of the `Select` component.
- [#145](https://github.com/equinor/webviz-core-components/pull/145) - Added wrapper components for typically used Dash components (Dropdown, Slider, etc) with additional styling.
- [#148](https://github.com/equinor/webviz-core-components/pull/148) - Changed default value of `numSecondsUntilSuggestionsAreShown` to 0.5 in `SmartNodeSelector` component
- [#150](https://github.com/equinor/webviz-core-components/pull/150) - Changed color of single remove button in `SmartNodeSelector` to the same as for the remove all button.
- [#151](https://github.com/equinor/webviz-core-components/pull/151) - `SmartNodeSelector`: Changes to `data` and `delimiter` props are considered now and cause the component to update.

### Added

- [#148](https://github.com/equinor/webviz-core-components/pull/148) - Added `lineBreakAfterTag` property to `SmartNodeSelector` which defaults to false. If set to true, tags are separated by a line break.

## [0.5.0] - 2021-06-06

### Changed

- [#134](https://github.com/equinor/webviz-core-components/pull/134) - When prereleases are done in GitHub, they will now be published to `npm` using the `next` tag. E.g. `npm install @webviz/core-components` will install the latest official release, while `npm install @webviz/core-components@next` will install the
    latest prerelease.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Moved `React` code and `Node.js` configuration into `./react/` directory.
    Adjusted `package.json`, `.gitignore`, `.vscode/launch.js` and GitHub workflow file accordingly.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Tightened `tsconfig` options in order to have a more strict code validation.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Synchronized ECMA Script version in `tsconfig` and `eslint`.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Added automatic removal of unused autogenerated files (`.Rbuildignore`).
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Removed `plotly-cartesian.js` and `package.json` (top level) from `MANIFEST.in`.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Adjusted components according to new `tsconfig` options.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Moved `flexbox.css` into new component folder.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Introduced `DefaultPropsHelper.ts` in order to account for coexistence of TypeScript restrictions and `React`'s `defaultProps`.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - `setup.py` is now reading package data from `package.json` file inside `webviz_core_components`.
- [#121](https://github.com/equinor/webviz-core-components/pull/121) - Changed rendering of `SmartNodeSelector` component when only one node can be selected.
- [#136](https://github.com/equinor/webviz-core-components/pull/136) - Changes to selected tags in `SmartNodeSelector` are now always sent.

### Added

- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Added `Storybook` for demo of components.
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Added `declarations.d.ts` file for ambient declarations for npm modules without type declarations.
- [#130](https://github.com/equinor/webviz-core-components/pull/130) - Added feedback button to `WebvizPluginPlaceholder`. Added `href` and `target` properties to `WebvizToolbarButton`.

### Fixed

- [#136](https://github.com/equinor/webviz-core-components/pull/136) - Several bug fixes in `SmartNodeSelector` (exception on entering invalid node name when no metadata given, exception on using several wildcards,
    new tag when pressing enter with single node selection and invalid data, node selected several times when its name is partly contained in other nodes, exception on holding backspace pressed).
- [#125](https://github.com/equinor/webviz-core-components/pull/125) - Removed `selectedNodes` attribute from `SmartNodeSelector` arguments in `usage.py`.
- [#124](https://github.com/equinor/webviz-core-components/pull/124) - `SmartNodeSelector` now returns all selected tags (also invalid and duplicate ones) to parent.
- [#123](https://github.com/equinor/webviz-core-components/pull/123) - Removed unused variables and added types to `SmartNodeSelector` and its tests.

## [0.4.1] - 2021-05-04

### Fixed

- [#122](https://github.com/equinor/webviz-core-components/pull/122) - Fixed bug in `WebvizPluginPlaceholder` preventing download button from working. Added tests for `WebvizPluginPlaceholder`.
- [#120](https://github.com/equinor/webviz-core-components/pull/120) - Multiple bug fixes (deletion of currently selected tag not possible; state not dynamically updated;
    empty or invalid node names no longer allowed; auto resizing not working when initializing tag component) and new tests for these bugs. Also removed unnecessary properties.

## [0.4.0] - 2021-04-26

### Added

- [#114](https://github.com/equinor/webviz-core-components/pull/114) - Added deprecation warning to `WebvizPluginPlaceholder`.

### Changed

- [#114](https://github.com/equinor/webviz-core-components/pull/114) - Better alignment of tooltips with icons and pointer cursor when hovering buttons in `WebvizPluginPlaceholder`.
- [#118](https://github.com/equinor/webviz-core-components/pull/118) - Remove `toImage` from default `modeBarButtonsToRemove` in `wcc.Graph`.

### Fixed

- [#114](https://github.com/equinor/webviz-core-components/pull/114) - Fixed bug in `WebvizPluginPlaceholder` preventing tooltips from being shown.

## [0.3.2] - 2021-04-09

- [#115](https://github.com/equinor/webviz-core-components/pull/115) - Removed postinstall script in order to not having npm trying to copy package.json when installing as npm package.
- [#113](https://github.com/equinor/webviz-core-components/pull/113) - Fixed LGTM warnings caused by SmartNodeSelector component's defaultProps definitions.
- [#107](https://github.com/equinor/webviz-core-components/pull/107) - Fixed bug in argument modifier method (when input argument is given as positional).
- [#107](https://github.com/equinor/webviz-core-components/pull/107) - Prevent false positives through LGTM/GitHub CodeQL.

## [0.3.1] - 2021-03-28

### Fixed

- [#105](https://github.com/equinor/webviz-core-components/pull/105) - Fixed bug when updating Select values from a Dash callback.

## [0.3.0] - 2021-03-26

### Fixed

- [#99](https://github.com/equinor/webviz-core-components/pull/99) - Fixed bug which prevented using the download button in `WebvizPluginPlaceholder` and started to download when component was mounting.

### Added

- [#96](https://github.com/equinor/webviz-core-components/pull/96) - Added publishing of npm package to Github Workflow

### Changed

- [#100](https://github.com/equinor/webviz-core-components/pull/100) - Adjusted build environment in order to be able to write
    components in TypeScript and to publish to npm. Also changed all components to TypeScript.

## [0.2.0] - 2021-03-11

### Changed

- [#86](https://github.com/equinor/webviz-core-components/pull/86) - Refactored and converted code to TypeScript (main component files to JSX), adjusted build environment accordingly and added validation of JS/TS to GitHub workflow

### Added

- [#87](https://github.com/equinor/webviz-core-components/pull/87) - Added new SmartNodeSelector component and Jest testing framework
- [#76](https://github.com/equinor/webviz-core-components/pull/76) - Python 3.9 support formally added (through CI).
