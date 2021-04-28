# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UNRELEASED] - YYYY-MM-DD

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
