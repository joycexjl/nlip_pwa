[![CI](https://github.com/IBM/pwa-lit-template/workflows/CI/badge.svg)](https://github.com/IBM/pwa-lit-template/actions)
[![Built with pwa-lit-template](https://img.shields.io/badge/built%20with-pwa--lit--template-blue)](https://github.com/IBM/pwa-lit-template 'Built with pwa-lit-template')

# NLIP-PWA

This is a Progressive Web App for demonstrating the Natural Language Interaction Protocol in application.

## Getting started

### Quick Start

Start the development environment using docker compose: 

```
version: '3.8'
services:
  app:
  	container_name: nlip_pwa
    build: .
    ports:
      - "8000:8000" # Modify this line according to your local port
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev 
```

Then run:

```
docker compose up -d 
```

 

### Prerequisites

- [node.js](https://nodejs.org)

Furthermore, this project is built on [TypeScript](https://www.typescriptlang.org) with the intention of improving the developer experience.

### Install the dependencies

    npm install

### Start the development server

This command serves the app at `http://localhost:8000`:

    npm start

### Project structure

```
├─ images/
├─ patches/
├─ server/
├─ src/
│  ├─ components/
│  │  ├─ app-index.ts
│  │  └─ ···
│  ├─ helpers/
│  │  ├─ page-element.ts
│  │  └─ ···
│  ├─ pages/
│  │  ├─ page-home.ts
│  │  └─ ···
│  ├─ router/
│  │  └─ routes.ts
│  └─ config.ts
├─ index.html
├─ manifest.webmanifest
├─ package.json
├─ robots.txt
├─ rollup.config.js
└─ tsconfig.json
```

- `images`: is use to store the static resourced used by your application.
- `patches`: contains the patches to apply in the different packages mentioned [here](#things-to-be-aware). It will be removed at some point.
- `server`: contains the logic to serve the application. And is where you are going to create your `dist/` folder containing the bundle of your application.
- `src`
  - `components`: contains your custom Web Components. Inside this folder you will find the `app-index.ts` file, main root of your application following the PRPL patern.
  - `helpers`: contains two interesting features: `PageElement` and `html-meta-manager`. Go more in-depth with them [here](#create-a-new-page).
  - `pages`: where you create the pages for your application.
  - `router`: where you create the routes for your application.
  - `config.ts`: stores the application configuration variables. Go more in-depth with it [here](#environment-configuration).
- `index.html`: the application entry point.

## Guides

### Build for production

This command use Rollup to build an optimized version of the application for production:

    npm run build

It has two outputs: in addition to outputting a regular build, it outputs a legacy build which is compatible with older browsers down to IE11.

At runtime it is determined which version should be loaded, so that legacy browsers don't force to ship more and slower code to most users on modern browsers.

Note: If you need to add static files to the build, like the `images` folder or the `manifest.webmanifest`, you should register them in the `copy()` plugin of the `rollup.config.js`.

### Create a new page

1. Create the new page component (extending from `PageElement` helper) in the `pages` folder. For example a `page-explore.ts`.

   ```typescript
   import { html } from 'lit';
   import { customElement } from 'lit/decorators.js';

   import { PageElement } from '../helpers/page-element.js';

   @customElement('page-explore')
   export class PageExplore extends PageElement {
     render() {
       return html`
         <h1>Explore</h1>
         <p>My new explore page!</p>
       `;
     }

     meta() {
       return {
         title: 'Explore',
         description: 'Explore page description',
       };
     }
   }
   ```

2. Register the new route in the `routes.ts`:

   ```typescript
   {
     path: '/explore',
     name: 'explore',
     component: 'page-explore',
     action: async () => {
       await import('../pages/page-explore.js');
     }
   },
   ```

With SEO in mind, this project offers you the `PageElement` base class to help you to deal with it; it has a `meta()` method that edits the HTML meta tags of the specific page. You must override that method to provide the data.

### Environment configuration

This project allows different configurations per environment. The file that manages that configuration is `src/config.ts`. If you are interested in overwrite any of the configuration variables depending of the environment, you can create a file following the rule `src/config.{NODE_ENV}.ts`. Take into account that you don't need to replicate all the variables, just change the variable that you need to be different this way:

```typescript
import config from './config.js';

export default {
  ...config,
  environment: 'staging',
};
```

In the build process the references in the project (but not in the configuration files) of `./config` will be replaced to `./config.{NODE_ENV}` loading the expected configuration file for the target environment.

Lastly, the way to use that configuration is quite simple. You only need to import it:

```typescript
import config from '../config.js';
```

And use it where you need it:

```typescript
render() {
  return html`
    <footer>
      <span>Environment: ${config.environment}</span>
    </footer>
  `;
}
```

### Service worker

This project has configured the generation and injection of a service worker in the build process. But it is disabled by default. To enable it you just need to change the variable `GENERATE_SERVICE_WORKER` in the `rollup.config.js` to `true`.

Also you can change the Workbox configuration too modifying the variable `workboxConfig` in that same file.

## Browser support

- Chrome
- Edge
- Firefox
- Safari

To run on other browsers, you need to use a combination of polyfills and transpilation.
This step is automated by the [build for production command](#build-for-production).
