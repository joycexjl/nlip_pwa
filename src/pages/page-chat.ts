/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignalWatcher } from '@lit-labs/signals';
import { html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { sendTextMessage, sendImageMessage } from '../components/network.js';
import { PageElement } from '../helpers/page-element.js';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  image?: {
    data: string;
    type: string;
  };
}

@customElement('page-chat')
export class PageChat extends SignalWatcher(PageElement) {
  @state() private messages: ChatMessage[] = [];
  @query('#chat-input') chatInput?: HTMLTextAreaElement;
  @query('#image-input') imageInput?: HTMLInputElement;
  @state() private showSuccessPopup = false;
  @state() private showErrorPopup = false;
  @state() private errorMessage = '';

  private static readonly STORAGE_KEY = 'chat-history';

  private loadChatHistory() {
    const savedHistory = localStorage.getItem(PageChat.STORAGE_KEY);
    if (savedHistory) {
      this.messages = JSON.parse(savedHistory);
    }
  }

  private saveChatHistory() {
    localStorage.setItem(PageChat.STORAGE_KEY, JSON.stringify(this.messages));
  }

  private addMessage(
    type: 'user' | 'ai',
    content: string,
    image?: { data: string; type: string }
  ) {
    this.messages = [
      ...this.messages,
      {
        type,
        content,
        timestamp: Date.now(),
        ...(image && { image }),
      },
    ];
    this.saveChatHistory();
    // Scroll to bottom after adding new message
    requestAnimationFrame(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    });
  }

  static styles = css`


    @supports (padding: max(0px)) {
      .toolbar {
        height: calc(60px + env(safe-area-inset-bottom));
        padding-bottom: max(env(safe-area-inset-bottom), 0px);
      }
    }    :host {
      display: block;
      min-height: 100vh;
      padding-bottom: calc(120px + env(safe-area-inset-bottom));
      background: #f5f5f7;
      user-select: none;
      user-select: none;
      touch-action: pan-x pan-y;
      -webkit-touch-callout: none;
      overscroll-behavior: none;
    }

    * {
      touch-action: pan-x pan-y;
      -webkit-touch-callout: none;
    }

    .chat-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: min(90vw, 800px);
      margin: 0 auto;
      padding: clamp(1rem, 5vw, 2rem);
      overscroll-behavior: contain;
    }

    .message {
      max-width: 80%;
      margin-bottom: 0;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    .user-message {
      align-self: flex-end;
      background: #007bff;
      color: white;
    }

    .ai-message {
      align-self: flex-start;
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
      user-select: text;
      user-select: text;
      touch-action: pan-x pan-y;
    }

    .message-image {
      overflow: hidden;
      max-width: 100%;
      margin-top: 0.5rem;
      border-radius: 8px;
    }

    .message-image img {
      display: block;
      object-fit: contain;
      width: 100%;
      height: auto;
      max-height: 300px;
      background: #f0f0f0;
    }

    .chat-input-container {
      position: fixed;
      right: 0;
      bottom: 60px;
      left: 0;
      z-index: 1000;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      max-width: min(90vw, 800px);
      margin: 0 auto;
      padding: 16px;
      background: white;
      box-shadow: 0 -2px 10px rgb(0 0 0 / 10%);
    }

    .chat-input-wrapper {
      position: relative;
      display: flex;
      flex: 1;
      gap: 12px;
      align-items: flex-start;
      min-width: 0; /* Prevent flex item from overflowing */
    }

    .chat-input {
      flex: 1;
      width: 100%;
      min-height: 40px;
      max-height: 120px;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
      color: #333;
      font-size: 16px;
      font-family: inherit;
      line-height: 1.5;
      resize: none;
      transition: border-color 0.2s;
      touch-action: manipulation;
      text-size-adjust: 100%;
    }

    .chat-input:focus {
      border-color: #007bff;
      outline: none;
    }

    .button-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .image-upload-button,
    .send-button {
      display: flex;
      flex-shrink: 0;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .image-upload-button {
      background: #f0f0f0;
      color: #666;
    }

    .image-upload-button:hover {
      background: #e0e0e0;
    }

    .send-button {
      background: #007bff;
      color: white;
    }

    .send-button:hover {
      background: #0056b3;
    }

    .image-upload-button svg,
    .send-button svg {
      width: 24px;
      height: 24px;
    }

    .success-popup,
    .error-popup {
      position: fixed;
      top: 20px;
      left: 50%;
      z-index: 2000;
      max-width: 90vw;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      font-weight: 500;
      text-align: center;
      word-break: break-word;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      transform: translateX(-50%);
    }

    .success-popup {
      background: #4caf50;
    }

    .error-popup {
      background: #f44336;
    }

    .success-popup.show,
    .error-popup.show {
      opacity: 1;
    }

    .hidden-file-input {
      display: none;
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

  private showSuccess() {
    this.showSuccessPopup = true;
    this.showErrorPopup = false;
    setTimeout(() => {
      this.showSuccessPopup = false;
    }, 3000);
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.showErrorPopup = true;
    this.showSuccessPopup = false;
    setTimeout(() => {
      this.showErrorPopup = false;
    }, 5000);
  }

  private async handleSend() {
    if (!this.chatInput?.value) return;

    const userMessage = this.chatInput.value;
    this.addMessage('user', userMessage);
    this.chatInput.value = '';

    try {
      const response = await sendTextMessage(userMessage);
      this.addMessage('ai', response);
      this.showSuccess();
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Failed to send message. Please try again.');
    }
  }

  private handleImageSelect() {
    this.imageInput?.click();
  }

  private async handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/bmp'].includes(file.type)
    ) {
      this.showError(
        'Please select a valid image file (JPEG, PNG, GIF, or BMP)'
      );
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const base64Image = (e.target.result as string).split(',')[1];
        const prompt =
          this.chatInput?.value || 'What do you see in this image?';

        this.addMessage('user', `Image uploaded with prompt: ${prompt}`, {
          data: e.target.result as string,
          type: file.type,
        });

        if (this.chatInput) this.chatInput.value = '';
        input.value = '';

        try {
          const response = await sendImageMessage(
            prompt,
            base64Image,
            file.type
          );
          this.addMessage('ai', response);
          this.showSuccess();
        } catch (error) {
          console.error('Error sending image:', error);
          this.showError('Failed to process image. Please try again.');
        }
      }
    };
    reader.readAsDataURL(file);
  }

  render() {
    return html`
      <div class="success-popup ${this.showSuccessPopup ? 'show' : ''}">
        Message sent successfully!
      </div>

      <div class="error-popup ${this.showErrorPopup ? 'show' : ''}">
        ${this.errorMessage}
      </div>

      <div class="chat-container">
        ${this.messages.map(
          (message) => html`
            <div class="message ${message.type}-message">
              <div class="message-header">
                ${message.type === 'user' ? 'You' : 'AI'}
              </div>
              <div class="message-content">${message.content}</div>
              ${message.image
                ? html`
                    <div class="message-image">
                      <img
                        src="${message.image.data}"
                        alt="User uploaded content in chat"
                      />
                    </div>
                  `
                : ''}
            </div>
          `
        )}
      </div>

      <div class="chat-input-container">
        <div class="chat-input-wrapper">
          <textarea
            id="chat-input"
            class="chat-input"
            placeholder="Type your message..."
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
              }
            }}
          ></textarea>
          <div class="button-group">
            <button
              class="image-upload-button"
              @click=${this.handleImageSelect}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                />
              </svg>
            </button>

            <button class="send-button" @click=${this.handleSend}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        <input
          type="file"
          id="image-input"
          class="hidden-file-input"
          accept="image/jpeg,image/png,image/gif,image/bmp"
          @change=${this.handleImageUpload}
        />
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

  connectedCallback(): void {
    super.connectedCallback?.();
    // Prevent zooming on mobile devices
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);

    // Load chat history from localStorage
    this.loadChatHistory();

    // Load chat data from sessionStorage if exists
    const chatData = sessionStorage.getItem('chatData');
    if (chatData) {
      const { userPrompt, aiResponse } = JSON.parse(chatData);
      this.addMessage('user', userPrompt);
      this.addMessage('ai', aiResponse);
      sessionStorage.removeItem('chatData');
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback?.();
    // Remove the viewport meta tag when component is disconnected
    const meta = document.head.querySelector('meta[name="viewport"]');
    if (meta) {
      document.head.removeChild(meta);
    }
  }

  meta() {
    return {
      title: 'Chat',
      description: 'Chat with AI',
    };
  }
}
