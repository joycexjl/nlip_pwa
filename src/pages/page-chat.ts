/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignalWatcher } from '@lit-labs/signals';
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { PageElement } from '../helpers/page-element.js';

@customElement('page-chat')
export class PageChat extends SignalWatcher(PageElement) {
  @property({ type: String }) userPrompt = '';
  @property({ type: String }) aiResponse = '';

  connectedCallback(): void {
    super.connectedCallback?.();
    // Load chat data from sessionStorage
    const chatData = sessionStorage.getItem('chatData');
    if (chatData) {
      const { userPrompt, aiResponse } = JSON.parse(chatData);
      this.userPrompt = userPrompt;
      this.aiResponse = aiResponse;
      // Clear the data after loading
      sessionStorage.removeItem('chatData');
    }
  }

  static styles = css`


    @supports (padding: max(0px)) {
      .toolbar {
        height: calc(60px + env(safe-area-inset-bottom));
        padding-bottom: max(env(safe-area-inset-bottom), 0px);
      }
    }        :host {
      display: block;
      min-height: 100vh;
      padding-bottom: 60px;
      background: #f5f5f7;
    }

    .chat-container {
      max-width: min(90vw, 800px);
      margin: 0 auto;
      padding: clamp(1rem, 5vw, 2rem);
    }

    .message {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    .user-message {
      margin-left: 2rem;
      background: #007bff;
      color: white;
    }

    .ai-message {
      margin-right: 2rem;
      background: white;
      color: #333;
    }

    .message-header {
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .message-content {
      line-height: 1.5;
    }

    /* Bottom Toolbar Styles */
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

    .toolbar svg {
      width: 24px;
      height: 24px;
      margin-bottom: 4px;
    }
  `;

  render() {
    return html`
      <div class="chat-container">
        <div class="message user-message">
          <div class="message-header">You</div>
          <div class="message-content">${this.userPrompt}</div>
        </div>
        <div class="message ai-message">
          <div class="message-header">AI</div>
          <div class="message-content">${this.aiResponse}</div>
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
        <a href="/user">
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
}
