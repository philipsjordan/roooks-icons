# roooks-icons

An open-source icon set with one cohesive style. The free rounded outline set is MIT licensed.

> Work in progress. Internal beta planned for 1 November 2026. The name is a placeholder until launch.

## Contents

- `icons/`: the free SVG icons (MIT)
- `icons.json`: the manifest of published icons
- `scripts/`: validation and build scripts

Paid style modules are not in this repository.

## Manifest

`icons.json` lists the icons that are published (reviewed and ready), with their display name, category, tags, aliases and keywords. The website builds from it, so an SVG that is not listed does not appear on the site. CI checks the manifest against the `icons/` folder (`node scripts/validate-manifest.mjs`).

## Found a problem, or want an icon?

Open an issue and pick a template:

- **Icon issue**: something is wrong with an existing icon
- **Icon request**: ask for a new icon

## Versioning

One version for the whole library, following semver:

- Major: breaking changes (icon renamed or removed, grid or stroke spec change)
- Minor: new icons
- Patch: fixes

## Licence

MIT, see [LICENSE](LICENSE).
