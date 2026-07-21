# MyCompany source baseline 1.2.6

The working Windows baseline is `MyCompany-1.2.6-windows-entrypoint-fix.zip`.

## Integrity

```text
SHA-256: 2e22d58e4e20703baee12f50eb33746a6d55041b12383df8bf54d62e9c784d08
```

## Entrypoint rule

The plugin contains exactly one case-insensitive entrypoint file:

```text
MyCompany.js
```

This file exports both factories:

```javascript
MyCompany
mycompany
```

A separate lowercase `mycompany.js` must not be added because it overwrites `MyCompany.js` on Windows filesystems.

## Seed model

Repository/package sources:

```text
seed/MyScripts
seed/MyCommands
```

Runtime libraries:

```text
meshcentral-data/mycompany-data/myscripts/scripts
meshcentral-data/mycompany-data/scripts/MyCommands
```

Original seed libraries are synchronized from:

- `Eris92/MeshCentral-MyScripts` → `seed/MyScripts`
- `Eris92/MeshCentral-MyCommands` → `seed/MyCommands`

All new MyCompany changes must preserve this baseline and pass the repository tests before publishing.
