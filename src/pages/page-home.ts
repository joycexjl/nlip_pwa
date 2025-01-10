/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignalWatcher } from '@lit-labs/signals';
import { Router } from '@vaadin/router';
import { html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { sendTextMessage, sendImageMessage } from '../components/network.js';
import config from '../config.js';
import { PageElement } from '../helpers/page-element.js';

@customElement('page-home')
export class PageHome extends SignalWatcher(PageElement) {
  @query('#text-input') textInput?: HTMLTextAreaElement;
  @query('#image-input') imageInput?: HTMLInputElement;
  @query('#image-prompt') imagePrompt?: HTMLTextAreaElement;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      padding-bottom: 60px;
      background: #f5f5f7;
    }

    .container {
      max-width: min(90vw, 800px);
      margin: 0 auto;
      padding: clamp(1rem, 5vw, 2rem);
    }

    h1 {
      margin-bottom: clamp(1rem, 4vw, 2rem);
      color: #333;
      font-size: clamp(1.5rem, 4vw, 2rem);
      text-align: center;
    }

    .input-section {
      margin-bottom: 2rem;
      padding: clamp(1rem, 3vw, 1.5rem);
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    h2 {
      margin: 0 0 1rem;
      color: #444;
      font-size: clamp(1.2rem, 3vw, 1.4rem);
    }

    .text-area {
      width: 100%;
      min-height: 100px;
      margin-bottom: 1rem;
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      resize: vertical;
    }

    .file-input-wrapper {
      margin-bottom: 1rem;
    }

    .file-input {
      display: block;
      width: 100%;
      padding: 0.8rem;
      border: 2px dashed #ddd;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .file-input:hover {
      border-color: #aaa;
    }

    button {
      display: block;
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      background: #007bff;
      color: white;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover {
      background: #0056b3;
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

    @media (hover: hover) {
      .input-section:hover {
        transform: translateY(-2px);
      }
    }

    @supports (padding: max(0px)) {
      .toolbar {
        height: calc(60px + env(safe-area-inset-bottom));
        padding-bottom: max(env(safe-area-inset-bottom), 0px);
      }
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>Natural Language Interaction Protocol</h1>

        <div class="input-section">
          <h2>Text Only Query</h2>
          <textarea
            id="text-input"
            class="text-area"
            placeholder="Enter your text query here..."
          ></textarea>
          <button @click=${this.handleTextSubmit}>Send Text Query</button>
        </div>

        <div class="input-section">
          <h2>Image with Text Query</h2>
          <div class="file-input-wrapper">
            <input
              type="file"
              id="image-input"
              accept="image/jpeg,image/png,image/gif,image/bmp"
              class="file-input"
              @change=${this.handleImageSelect}
            />
          </div>
          <textarea
            id="image-prompt"
            class="text-area"
            placeholder="Enter your question about the image..."
          ></textarea>
          <button @click=${this.handleImageSubmit}>Send Image Query</button>
        </div>
      </div>

      <nav class="toolbar">
        <a href="/" class="active">
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

  async handleTextSubmit() {
    if (this.textInput?.value) {
      try {
        const response = await sendTextMessage(this.textInput.value);
        const prompt = this.textInput.value;
        this.textInput.value = ''; // Clear input

        // Store data in sessionStorage for the chat page
        sessionStorage.setItem(
          'chatData',
          JSON.stringify({
            userPrompt: prompt,
            aiResponse: response,
          })
        );

        // Navigate to chat page
        Router.go('/chat');
      } catch (error) {
        console.error('Error sending text:', error);
      }
    }
  }

  handleImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (
        !['image/jpeg', 'image/png', 'image/gif', 'image/bmp'].includes(
          file.type
        )
      ) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or BMP)');
        input.value = '';
      }
    }
  }

  async handleImageSubmit() {
    if (!this.imageInput?.files?.length) {
      alert('Please select an image first');
      return;
    }

    const file = this.imageInput.files[0];
    const prompt = this.imagePrompt?.value || 'What do you see in this image?';
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (e.target?.result) {
        const base64Image = (e.target.result as string).split(',')[1];
        try {
          const response = await sendImageMessage(
            prompt,
            base64Image,
            file.type
          );

          // Store data in sessionStorage for the chat page
          sessionStorage.setItem(
            'chatData',
            JSON.stringify({
              userPrompt: `Image uploaded with prompt: ${prompt}`,
              aiResponse: response,
            })
          );

          // Clear inputs
          this.imageInput!.value = '';
          if (this.imagePrompt) this.imagePrompt.value = '';

          // Navigate to chat page
          Router.go('/chat');
        } catch (error) {
          console.error('Error sending image:', error);
          alert('Error processing image. Please try again.');
        }
      }
    };

    reader.readAsDataURL(file);
  }

  meta() {
    return {
      title: config.appName,
      titleTemplate: null,
      description: config.appDescription,
    };
  }
}
