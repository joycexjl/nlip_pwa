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
