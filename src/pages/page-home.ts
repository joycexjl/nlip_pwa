/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Router } from '@vaadin/router';
import { html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { sendTextMessage, sendImageMessage } from '../components/network.js';
import config from '../config.js';
import { PageElement } from '../helpers/page-element.js';

@customElement('page-home')
export class PageHome extends PageElement {
  @query('#text-input') textInput?: HTMLTextAreaElement;
  @query('#image-upload') imageInput?: HTMLInputElement;
  @query('#speech-button') speechButton?: HTMLButtonElement;

  // private mediaRecorder: MediaRecorder | null = null;
  // private audioChunks: Blob[] = [];

  static styles = css`
    /* Safe area support for notched devices */
    @supports (padding: max(0px)) {
      .toolbar {
        height: calc(60px + env(safe-area-inset-bottom));
        padding-bottom: max(env(safe-area-inset-bottom), 0px);
      }
    }

    @media (hover: hover) {
      .input-section:hover {
        transform: translateY(-2px);
      }
    }

    /* Landscape orientation adjustments */
    @media screen and (max-height: 600px) and (orientation: landscape) {
      .input-container {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
    }

    /* Desktop layout */
    @media screen and (min-width: 768px) {
      .input-container {
        grid-template-columns: 1fr;
      }

      .input-section {
        max-width: 100%;
      }
    }

    /* Touch device optimizations */
    @media (hover: none) {
      button {
        padding: clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem);
      }

      .input-section {
        padding: clamp(1.2rem, 4vw, 1.8rem);
      }
    }
    :host {
      position: relative;
      display: block;
      box-sizing: border-box;
      min-height: 100vh;
      padding-bottom: 60px; /* Space for toolbar */
      background: #f5f5f7;
    }

    section {
      box-sizing: border-box;
      max-width: min(90vw, 800px);
      margin: 0 auto;
      padding: clamp(1rem, 5vw, 2rem);
    }

    .input-container {
      display: grid;
      gap: clamp(1rem, 3vw, 2rem);
      margin-top: clamp(1rem, 3vw, 2rem);
    }

    .input-section {
      padding: clamp(1rem, 3vw, 1.5rem);
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
      transition: transform 0.2s;
    }

    h1 {
      margin-bottom: clamp(0.5rem, 3vw, 1rem);
      color: #333;
      font-size: clamp(1.5rem, 4vw, 2rem);
      line-height: 1.2;
      text-align: center;
    }

    h2 {
      margin: 0 0 1rem;
      color: #444;
      font-size: clamp(1rem, 3vw, 1.2rem);
    }

    .image-upload {
      display: block;
      padding: clamp(1rem, 3vw, 2rem);
      border: 2px dashed #ccc;
      border-radius: 8px;
      font-size: clamp(0.875rem, 2.5vw, 1rem);
      text-align: center;
      cursor: pointer;
    }

    .image-upload:hover {
      border-color: #666;
    }

    textarea {
      box-sizing: border-box;
      width: 100%;
      min-height: clamp(80px, 20vh, 100px);
      padding: 0.8rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: clamp(0.875rem, 2.5vw, 1rem);
      resize: vertical;
    }

    .speech-input {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    button {
      padding: clamp(0.6rem, 2vw, 0.8rem) clamp(1rem, 3vw, 1.5rem);
      border: none;
      border-radius: 8px;
      background: #007bff;
      color: white;
      font-weight: 500;
      font-size: clamp(0.875rem, 2.5vw, 1rem);
      cursor: pointer;
      transition: background-color 0.2s;
      touch-action: manipulation;
    }

    button:hover {
      background: #0056b3;
    }

    #speech-status {
      color: #666;
      font-style: italic;
      font-size: clamp(0.875rem, 2.5vw, 1rem);
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

    .toolbar a.active {
      color: #007bff;
    }

    .toolbar svg {
      width: 24px;
      height: 24px;
      margin-bottom: 4px;
    }
  `;

  render() {
    return html`
      <section>
        <h1>Natural Language Interaction Protocol</h1>

        <div class="input-container">
          <div class="input-section">
            <h2>📸 Image Input</h2>
            <label for="image-upload" class="image-upload">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                style="display: none;"
                @change=${this.handleImageUpload}
              />
              Click or drag and drop to upload an image
            </label>
          </div>

          <div class="input-section">
            <h2>✏️ Text Input</h2>
            <textarea
              id="text-input"
              placeholder="Type your message here..."
              aria-label="Text input"
            ></textarea>
            <button @click=${this.handleTextSubmit}>Send</button>
          </div>
        </div>
      </section>

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

  meta() {
    return {
      title: config.appName,
      titleTemplate: null,
      description: config.appDescription,
    };
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

  async handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Image = (e.target.result as string).split(',')[1];
          try {
            const response = await sendImageMessage(
              'Describe this picture',
              base64Image,
              file.type
            );

            // Store data in sessionStorage for the chat page
            sessionStorage.setItem(
              'chatData',
              JSON.stringify({
                userPrompt: 'Image uploaded: ' + file.name,
                aiResponse: response,
              })
            );

            // Navigate to chat page
            Router.go('/chat');
          } catch (error) {
            console.error('Error sending image:', error);
          }
        }
      };

      reader.readAsDataURL(file);
    }
  }

  // async toggleSpeechRecording() {
  //   if (!this.mediaRecorder) {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //       this.mediaRecorder = new MediaRecorder(stream);
  //       this.audioChunks = [];

  //       this.mediaRecorder.ondataavailable = (event) => {
  //         this.audioChunks.push(event.data);
  //       };

  //       this.mediaRecorder.onstop = async () => {
  //         const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
  //         const reader = new FileReader();

  //         reader.onload = async (e) => {
  //           if (e.target?.result) {
  //             const base64Audio = (e.target.result as string).split(',')[1];
  //             try {
  //               // Note: You might need to add a sendAudioMessage function to network.ts
  //               // For now, we'll use sendTextMessage as a placeholder
  //               const response = await sendTextMessage("Audio recording submitted");
  //               console.log('Response:', response);
  //             } catch (error) {
  //               console.error('Error sending audio:', error);
  //             }
  //           }
  //         };

  //         reader.readAsDataURL(audioBlob);
  //       };

  //       this.mediaRecorder.start();
  //       if (this.speechButton) {
  //         this.speechButton.textContent = 'Stop Recording';
  //       }
  //     } catch (error) {
  //       console.error('Error accessing microphone:', error);
  //     }
  //   } else {
  //     this.mediaRecorder.stop();
  //     this.mediaRecorder = null;
  //     if (this.speechButton) {
  //       this.speechButton.textContent = 'Start Recording';
  //     }
  //   }
  // }
}
