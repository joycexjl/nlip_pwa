/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignalWatcher } from '@lit-labs/signals';
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageElement } from '../helpers/page-element.js';

@customElement('page-user')
export class PageUser extends SignalWatcher(PageElement) {
  static styles = css`


    /* Notched device support */
    @supports (padding: max(0px)) {
      .toolbar {
        height: calc(60px + env(safe-area-inset-bottom));
        padding-bottom: max(env(safe-area-inset-bottom), 0px);
      }
    }

    /* Landscape mode optimizations */
    @media screen and (orientation: landscape) and (max-height: 500px) {
      .container {
        padding-bottom: 80px;
      }

      .profile-info {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .action-buttons {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
    }

    /* Small screen optimizations */
    @media screen and (max-width: 360px) {
      .container {
        padding: max(0.5rem, env(safe-area-inset-top))
          max(0.5rem, env(safe-area-inset-right)) 0
          max(0.5rem, env(safe-area-inset-left));
      }

      .user-section {
        padding: 0.75rem;
      }

      .info-item {
        padding: 0.75rem;
      }

      button {
        padding: 0.75rem;
      }
    }    :host {
      display: block;
      box-sizing: border-box;
      min-height: 100vh;
      padding-bottom: calc(60px + env(safe-area-inset-bottom));
      background: #f5f5f7;
    }

    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }

    .container {
      max-width: min(90vw, 800px);
      margin: 0 auto;
      padding: max(1rem, env(safe-area-inset-top))
        max(1rem, env(safe-area-inset-right)) 0
        max(1rem, env(safe-area-inset-left));
    }

    h1 {
      margin: 0 0 clamp(1rem, 4vw, 2rem);
      color: #333;
      font-size: clamp(1.25rem, 5vw, 2rem);
      line-height: 1.2;
      text-align: center;
      word-wrap: break-word;
    }

    .user-section {
      margin-bottom: clamp(1rem, 4vw, 2rem);
      padding: clamp(0.75rem, 3vw, 1.5rem);
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    .profile-info {
      display: grid;
      gap: clamp(0.75rem, 2vw, 1rem);
    }

    .info-item {
      padding: clamp(0.75rem, 2vw, 1rem);
      border-radius: 8px;
      background: #f8f9fa;
    }

    .info-label {
      margin-bottom: 0.5rem;
      color: #666;
      font-weight: 500;
      font-size: clamp(12px, 3vw, 14px);
    }

    .info-value {
      color: #333;
      font-size: clamp(14px, 3.5vw, 16px);
      word-break: break-word;
    }

    .action-buttons {
      display: grid;
      gap: clamp(0.5rem, 2vw, 1rem);
      margin-top: clamp(1rem, 3vw, 1.5rem);
    }

    button {
      width: 100%;
      padding: clamp(0.75rem, 2.5vw, 1rem);
      border: none;
      border-radius: 8px;
      background: #007bff;
      color: white;
      font-weight: 500;
      font-size: clamp(14px, 3.5vw, 16px);
      line-height: 1.2;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    button:hover {
      background: #0056b3;
    }

    button:active {
      transform: translateY(1px);
    }

    button.secondary {
      background: #6c757d;
    }

    button.secondary:hover {
      background: #545b62;
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
      padding: 0 max(env(safe-area-inset-right), 8px)
        max(env(safe-area-inset-bottom), 0px)
        max(env(safe-area-inset-left), 8px);
      background: #fff;
      box-shadow: 0 -2px 10px rgb(0 0 0 / 10%);
    }

    .toolbar a {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      color: #666;
      font-size: clamp(11px, 3vw, 14px);
      text-decoration: none;
      user-select: none;
      transition: color 0.2s;
      -webkit-tap-highlight-color: transparent;
    }

    .toolbar a.active {
      color: #007bff;
    }

    .toolbar svg {
      width: clamp(20px, 6vw, 24px);
      height: clamp(20px, 6vw, 24px);
      margin-bottom: 4px;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>User Profile</h1>

        <div class="user-section">
          <div class="profile-info">
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">user@example.com</div>
            </div>
            <div class="info-item">
              <div class="info-label">Account Type</div>
              <div class="info-value">Standard User</div>
            </div>
            <div class="info-item">
              <div class="info-label">Last Login</div>
              <div class="info-value">
                Today at ${new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button @click=${() => this.handleEditProfile()}>
              Edit Profile
            </button>
            <button class="secondary" @click=${() => this.handleLogout()}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <nav class="toolbar">
        <a href="/">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2zm0 2.84L19.5 12h-1.5v8h-4v-6H10v6H6v-8H4.5L12 4.84z"
            />
          </svg>
          Home
        </a>
        <a href="/user" class="active">
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

  private handleEditProfile() {
    // Placeholder for edit profile functionality
    alert('Edit profile functionality coming soon!');
  }

  private handleLogout() {
    // Placeholder for logout functionality
    alert('Logout functionality coming soon!');
  }
}
