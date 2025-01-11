/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignalWatcher } from '@lit-labs/signals';
import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import config from '../config.js';
import { attachRouter } from '../router/index.js';

import 'pwa-helper-components/pwa-install-button.js';
import 'pwa-helper-components/pwa-update-available.js';

@customElement('app-index')
export class AppIndex extends SignalWatcher(LitElement) {
  @query('main')
  private main!: HTMLElement;

  @state()
  private currentPath = window.location.pathname;

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

    .toolbar {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1000;
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 60px;
      padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom)
        env(safe-area-inset-left);
      background: #fff;
      box-shadow: 0 -2px 10px rgb(0 0 0 / 10%);
    }

    .toolbar a {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      color: #666;
      font-size: 0.75rem;
      text-decoration: none;
      user-select: none;
      transition: color 0.2s;
      -webkit-tap-highlight-color: transparent;
    }

    .toolbar a.active {
      color: #007bff;
    }

    .toolbar svg {
      width: 24px;
      height: 24px;
      margin-bottom: 4px;
    }

    @supports (padding: max(0px)) {
      .toolbar {
        height: calc(60px + env(safe-area-inset-bottom));
        padding-bottom: max(env(safe-area-inset-bottom), 0px);
      }
    }
  `;

  private handleNavigation = () => {
    this.currentPath = window.location.pathname;
  };

  private handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.href) {
      const url = new URL(anchor.href);
      if (url.origin === window.location.origin) {
        this.currentPath = url.pathname;
      }
    }
  };

  override connectedCallback(): void {
    (super.connectedCallback as () => void)();
    window.addEventListener('popstate', this.handleNavigation);
    window.addEventListener('click', this.handleClick);
  }

  override disconnectedCallback(): void {
    (super.disconnectedCallback as () => void)();
    window.removeEventListener('popstate', this.handleNavigation);
    window.removeEventListener('click', this.handleClick);
  }

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

      <nav class="toolbar">
        <a href="/" class="${this.currentPath === '/' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2zm0 2.84L19.5 12h-1.5v8h-4v-6H10v6H6v-8H4.5L12 4.84z"
            />
          </svg>
          Home
        </a>
        <a href="/chat" class="${this.currentPath === '/chat' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
            />
          </svg>
          Chat
        </a>
        <a href="/user" class="${this.currentPath === '/user' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z"
            />
          </svg>
          User
        </a>
      </nav>
    `;
  }

  firstUpdated() {
    attachRouter(this.main);
  }
}
