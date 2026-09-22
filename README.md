# ADITEK

A responsive architecture website built with plain HTML, CSS, and JavaScript. No packages or installation step are required. Use Node.js 20 or newer.

## Run locally

```sh
npm run dev
```

Open http://127.0.0.1:3000. `npm start` starts the same server. To choose an interface and port:

```sh
npm run dev -- --host 0.0.0.0 --port 3001
```

## Build and preview

```sh
npm run build
npm run preview
```

The build validates the required public files, refreshes the generated `dist/` directory, and copies them with `assets/` into it. Deploy the contents of `dist/` to the root of a static web host. The preview server also accepts `--host` and `--port`; stop the development server first or use a different preview port.

The local server returns permanent (301) redirects for the old website routes. Configure equivalent redirects on the static host when replacing the existing site, accepting each old route with or without its trailing slash:

| Old route | New destination |
| --- | --- |
| `/leistungen/` | `/#leistungen` |
| `/referenzen/` | `/#projekte` |
| `/kontakt/` | `/#kontakt` |
| `/impressum/` | `/impressum.html` |
| `/datenschutz/` | `/datenschutz.html` |

## Content and assets

Fonts and photography are stored locally in `assets/`. Project photographs come from the existing ADITEK website; the Unsplash hero is illustrative architecture imagery and should not be presented as an ADITEK project. Keep any asset attribution and license files with the distributed site.

Contact actions use telephone and `mailto:` links. There is no form backend, analytics service, or remote font request. Review company details, project descriptions, and legal pages before publishing.

## Handoff notes

The office address needs confirmation: the existing homepage/contact information uses Windelsbleicher Str. 4, 33647 Bielefeld, while the existing legal notice lists Klashofstr. 99, 33659 Bielefeld. The redesign preserves those respective addresses. Confirmation has been requested from the owner and is still pending; this does not prevent running or reviewing the website locally. Confirm the appropriate contact and legal addresses before publication.

The privacy page also needs the chosen hosting provider and its actual server-log retention details checked before publication. No deployment has been performed.
