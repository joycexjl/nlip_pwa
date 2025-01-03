/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LitElement, html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import config from '../config.js';
import { attachRouter, urlForName } from '../router/index.js';

import 'pwa-helper-components/pwa-install-button.js';
import 'pwa-helper-components/pwa-update-available.js';

@customElement('app-index')
export class AppIndex extends LitElement {
  @query('main')
  private main!: HTMLElement;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    main,
    main > * {
      display: flex;
      flex: 1;
      flex-direction: column;
    }

    .pwa-buttons {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
      display: flex;
      gap: 0.5rem;
    }

    .pwa-buttons button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      background: #007bff;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .pwa-buttons button:hover {
      background: #0056b3;
    }

    footer {
      padding: 1rem;
      background-color: #eee;
      text-align: center;
    }

    main:empty ~ footer {
      display: none;
    }
  `;

  render() {
    return html`
      <div class="pwa-buttons">
        <pwa-install-button>
          <button>Install app</button>
        </pwa-install-button>

        <pwa-update-available>
          <button>Update app</button>
        </pwa-update-available>
      </div>

      <!-- The main content is added / removed dynamically by the router -->
      <main role="main"></main>

      <footer>
        <span>Environment: ${config.environment}</span>
      </footer>
    `;
  }

  firstUpdated() {
    attachRouter(this.main);
  }
}
