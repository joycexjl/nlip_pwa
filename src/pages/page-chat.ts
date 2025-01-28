/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignalWatcher } from '@lit-labs/signals';
import { html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Marked } from 'marked';

import { sendTextMessage, sendImageMessage } from '../components/network.js';
import { PageElement } from '../helpers/page-element.js';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  id: string;
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
  @state() private isAiTyping = false;
  @state() private showScrollButton = false;
  @state() private selectedMessageId: string | null = null;
  @state() private showContextMenu = false;
  @state() private contextMenuX = 0;
  @state() private contextMenuY = 0;
  @state() private editingMessageId: string | null = null;

  private static readonly STORAGE_KEY = 'chat-history';
  private documentClickHandler: (e: MouseEvent) => void;

  // Marked configuration without the 'mangle' property
  private marked = new Marked({
    breaks: true,
    gfm: true,
    silent: true
  });

  constructor() {
    super();
    this.documentClickHandler = this.onDocumentClick.bind(this);
    // Add scroll event listener with throttling
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolledFromBottom = 
            document.documentElement.scrollHeight - 
            window.innerHeight - 
            window.scrollY;
          this.showScrollButton = scrolledFromBottom > 200;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  private onDocumentClick(e: MouseEvent) {
    if (this.showContextMenu && !(e.target as Element).closest('.context-menu')) {
      this.hideContextMenu();
    }
  }

  private loadChatHistory() {
    const savedHistory = localStorage.getItem(PageChat.STORAGE_KEY);
    if (savedHistory) {
      this.messages = JSON.parse(savedHistory);
    }
  }

  private saveChatHistory() {
    localStorage.setItem(PageChat.STORAGE_KEY, JSON.stringify(this.messages));
  }

  private generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private addMessage(
    type: 'user' | 'ai',
    content: string,
    image?: { data: string; type: string }
  ) {
    const message: ChatMessage = {
      type,
      content,
      timestamp: Date.now(),
      id: this.generateMessageId(),
      ...(image && { image }),
    };
    this.messages = [...this.messages, message];
    this.saveChatHistory();
    this.scrollToBottom();
  }

  private scrollToBottom() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      padding-bottom: calc(140px + env(safe-area-inset-bottom));
      background: #f5f5f7;
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
      padding-bottom: calc(80px + env(safe-area-inset-bottom));
      overscroll-behavior: contain;
    }

    .toolbar {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 900;
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 60px;
      padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      background: rgb(255 255 255 / 95%);
      box-shadow: 0 -2px 10px rgb(0 0 0 / 10%);
      backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
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

    .message {
      position: relative;
      max-width: 80%;
      margin-bottom: 0;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
      user-select: text;
      transition: background-color 0.2s;
    }

    .message.selected {
      background-color: rgb(0 123 255 / 10%);
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
      touch-action: pan-x pan-y;
    }

    .message-content.markdown {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .message-content.markdown p {
      margin: 0.5em 0;
    }

    .message-content.markdown code {
      padding: 0.2em 0.4em;
      border-radius: 6px;
      background-color: rgb(175 184 193 / 20%);
      font-size: 0.9em;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    }

    .message-content.markdown pre {
      overflow-x: auto;
      padding: 1em;
      border-radius: 6px;
      background-color: #f6f8fa;
    }

    .message-content.markdown pre code {
      display: block;
      overflow-x: auto;
      padding: 0;
      background-color: transparent;
      white-space: pre;
    }

    .message-content.markdown h1,
    .message-content.markdown h2,
    .message-content.markdown h3,
    .message-content.markdown h4,
    .message-content.markdown h5,
    .message-content.markdown h6 {
      margin: 0.5em 0;
      font-weight: 600;
      line-height: 1.25;
    }

    .message-content.markdown ul,
    .message-content.markdown ol {
      margin: 0.5em 0;
      padding-left: 2em;
    }

    .message-content.markdown blockquote {
      margin: 0.5em 0;
      padding-left: 1em;
      border-left: 3px solid #ddd;
      color: #666;
    }

    .message-content.markdown a {
      color: #0366d6;
      text-decoration: none;
    }

    .message-content.markdown a:hover {
      text-decoration: underline;
    }

    .message-content.markdown table {
      width: 100%;
      margin: 0.5em 0;
      border-collapse: collapse;
    }

    .message-content.markdown th,
    .message-content.markdown td {
      padding: 6px 13px;
      border: 1px solid #ddd;
    }

    .message-content.markdown tr:nth-child(2n) {
      background-color: rgb(0 0 0 / 2%);
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
      bottom: calc(60px + env(safe-area-inset-bottom));
      left: 0;
      left: 50%;
      z-index: 1000;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      box-sizing: border-box;
      width: 100%;
      max-width: min(95vw, 800px);
      margin: 0 auto;
      padding: clamp(8px, 3vw, 16px);
      border-radius: 16px;
      background: rgb(255 255 255 / 95%);
      box-shadow: 0 -2px 20px rgb(0 0 0 / 15%);
      transform: translateX(-50%);
      backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
    }

    .chat-input-wrapper {
      position: relative;
      display: flex;
      flex: 1;
      gap: clamp(8px, 2vw, 12px);
      align-items: flex-start;
      width: 100%;
      min-width: 0;
    }

    .chat-input {
      flex: 1;
      box-sizing: border-box;
      width: 100%;
      min-height: clamp(40px, 6vh, 60px);
      max-height: clamp(120px, 20vh, 200px);
      padding: clamp(8px, 2vw, 12px);
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
      color: #333;
      font-size: clamp(14px, 4vw, 16px);
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

    @media (max-width: 480px) {
      .chat-input-container {
        bottom: calc(65px + env(safe-area-inset-bottom));
        max-width: 92vw;
        padding: 8px;
      }
      
      .chat-container {
        padding-bottom: calc(90px + env(safe-area-inset-bottom));
      }
      
      .button-group {
        gap: 4px;
      }

      .image-upload-button,
      .send-button {
        width: 36px;
        height: 36px;
      }
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      align-self: flex-start;
      max-width: 80px;
      padding: 12px 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #666;
      opacity: 0.3;
      animation: typingAnimation 1.4s infinite;
    }

    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing-animation {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
      }
    }

    .scroll-button {
      position: fixed;
      right: clamp(16px, 5vw, 24px);
      bottom: calc(180px + env(safe-area-inset-bottom));
      z-index: 1001;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      margin-right: calc((100vw - min(95vw, 800px)) / 2);
      padding: 0;
      border: none;
      border-radius: 50%;
      background: #007bff;
      color: white;
      box-shadow: 0 2px 10px rgb(0 0 0 / 20%);
      opacity: 0;
      cursor: pointer;
      pointer-events: none;
      transition: opacity 0.3s, transform 0.3s;
      transform: translateY(20px);
    }

    .scroll-button.show {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .scroll-button:hover {
      background: #0056b3;
    }

    .scroll-button svg {
      width: 24px;
      height: 24px;
    }

    @media (max-width: 480px) {
      .scroll-button {
        right: 16px;
        bottom: calc(160px + env(safe-area-inset-bottom));
        width: 36px;
        height: 36px;
        margin-right: calc((100vw - 92vw) / 2);
      }

      .scroll-button svg {
        width: 20px;
        height: 20px;
      }

      .chat-input {
        min-height: clamp(40px, 6vh, 60px);
        max-height: clamp(120px, 20vh, 200px);
      }
    }

    @media (min-width: 481px) {
      .chat-input {
        min-height: clamp(40px, 8vh, 80px);
        max-height: clamp(120px, 25vh, 250px);
      }
    }

    .context-menu {
      position: fixed;
      z-index: 1002;
      min-width: 160px;
      padding: 8px 0;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s, transform 0.2s;
      transform: scale(0.95);
      transform-origin: top left;
    }

    .context-menu.show {
      opacity: 1;
      pointer-events: auto;
      transform: scale(1);
    }

    .context-menu-item {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: none;
      color: #333;
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .context-menu-item:hover {
      background-color: #f5f5f7;
    }

    .context-menu-item svg {
      width: 18px;
      height: 18px;
      opacity: 0.7;
    }

    .message.editing {
      align-self: center;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1rem 0;
      transition: all 0.3s ease;
    }

    .editing-input-container {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      max-width: min(95vw, 800px);
      margin: 0 auto;
      padding: 8px 16px;
    }

    .editing-input {
      box-sizing: border-box;
      width: 100%;
      min-height: 80px;
      max-height: 400px;
      margin: 0;
      padding: 12px;
      border: 2px solid #007bff;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
      font-size: inherit;
      font-family: inherit;
      line-height: 1.5;
      resize: vertical;
      transition: all 0.2s ease;
    }

    .editing-input:focus {
      border-color: #0056b3;
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      outline: none;
    }

    .editing-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
      padding: 0 4px;
    }

    .editing-button {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .save-button {
      background: #007bff;
      color: white;
    }

    .save-button:hover {
      background: #0056b3;
    }

    .cancel-button {
      background: #f0f0f0;
      color: #333;
    }

    .cancel-button:hover {
      background: #e0e0e0;
    }

    @media (max-width: 480px) {
      .message.editing {
        margin: 0.5rem 0;
      }

      .editing-input-container {
        max-width: 92vw;
        padding: 8px;
      }

      .editing-input {
        padding: 10px;
        font-size: 16px; /* Prevent zoom on mobile */
      }

      .editing-actions {
        padding: 0;
      }
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
    this.isAiTyping = true;

    try {
      const response = await sendTextMessage(userMessage);
      this.isAiTyping = false;
      this.addMessage('ai', response);
      this.showSuccess();
    } catch (error) {
      this.isAiTyping = false;
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
        this.isAiTyping = true;

        try {
          const response = await sendImageMessage(
            prompt,
            base64Image,
            file.type
          );
          this.isAiTyping = false;
          this.addMessage('ai', response);
          this.showSuccess();
        } catch (error) {
          this.isAiTyping = false;
          console.error('Error sending image:', error);
          this.showError('Failed to process image. Please try again.');
        }
      }
    };
    reader.readAsDataURL(file);
  }

  private renderMessageContent(message: ChatMessage) {
    if (message.type === 'ai') {
      return html`<div class="message-content markdown">
        ${unsafeHTML(this.marked.parse(message.content))}
      </div>`;
    }
    
    return html`<div class="message-content">${message.content}</div>`;
  }

  private handleMessageInteraction(event: MouseEvent | TouchEvent, messageId: string) {
    const isLongPress = event.type === 'touchstart';
    if (isLongPress) {
      event.preventDefault();
      const touch = (event as TouchEvent).touches[0];
      this.showMessageContextMenu(touch.clientX, touch.clientY, messageId);
    } else if (event.type === 'contextmenu') {
      event.preventDefault();
      this.showMessageContextMenu(event.clientX, event.clientY, messageId);
    }
  }

  private showMessageContextMenu(x: number, y: number, messageId: string) {
    this.selectedMessageId = messageId;
    this.contextMenuX = x;
    this.contextMenuY = y;
    this.showContextMenu = true;
  }

  private hideContextMenu() {
    this.showContextMenu = false;
    this.selectedMessageId = null;
  }

  private copyMessage() {
    const message = this.messages.find(m => m.id === this.selectedMessageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
      this.showSuccess();
    }
    this.hideContextMenu();
  }

  private startEditMessage() {
    this.editingMessageId = this.selectedMessageId;
    this.hideContextMenu();
    
    // Add a small delay to allow the container to expand first
    requestAnimationFrame(() => {
      const textarea = this.renderRoot.querySelector('.editing-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        // Scroll the textarea into view with some padding
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  private cancelEdit() {
    this.editingMessageId = null;
  }

  private saveEditedMessage(event: Event, messageId: string) {
    const textarea = event.target as HTMLTextAreaElement;
    const messageIndex = this.messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1 && textarea.value.trim()) {
      const updatedMessages = [...this.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: textarea.value.trim()
      };
      this.messages = updatedMessages;
      this.saveChatHistory();
      this.showSuccess();
    }
    this.editingMessageId = null;
  }

  private resendMessage() {
    const message = this.messages.find(m => m.id === this.selectedMessageId);
    if (message) {
      if (this.chatInput) {
        this.chatInput.value = message.content;
      }
      this.handleSend();
    }
    this.hideContextMenu();
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
            <div 
              class="message ${message.type}-message ${message.id === this.selectedMessageId ? 'selected' : ''} ${message.id === this.editingMessageId ? 'editing' : ''}"
              @contextmenu=${(e: MouseEvent) => this.handleMessageInteraction(e, message.id)}
              @touchstart=${(e: TouchEvent) => {
                const timer = setTimeout(() => this.handleMessageInteraction(e, message.id), 500);
                const clearTimer = () => clearTimeout(timer);
                e.target?.addEventListener('touchend', clearTimer, { once: true });
                e.target?.addEventListener('touchmove', clearTimer, { once: true });
              }}
            >
              <div class="message-header">
                ${message.type === 'user' ? 'You' : 'AI'}
              </div>
              ${this.editingMessageId === message.id 
                ? html`
                    <div class="editing-input-container">
                      <textarea
                        class="editing-input"
                        .value=${message.content}
                        @keydown=${(e: KeyboardEvent) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            this.saveEditedMessage(e, message.id);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            this.cancelEdit();
                          }
                        }}
                      ></textarea>
                      <div class="editing-actions">
                        <button class="editing-button cancel-button" @click=${this.cancelEdit}>
                          Cancel
                        </button>
                        <button 
                          class="editing-button save-button" 
                          @click=${(e: Event) => this.saveEditedMessage(e, message.id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  `
                : this.renderMessageContent(message)
              }
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
        ${this.isAiTyping
          ? html`
              <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            `
          : ''}
      </div>

      <div 
        class="context-menu ${this.showContextMenu ? 'show' : ''}"
        style="left: ${this.contextMenuX}px; top: ${this.contextMenuY}px;"
      >
        <button class="context-menu-item" @click=${this.copyMessage}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          Copy
        </button>
        <button class="context-menu-item" @click=${this.startEditMessage}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Edit
        </button>
        <button class="context-menu-item" @click=${this.resendMessage}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Resend
        </button>
      </div>

      <button 
        class="scroll-button ${this.showScrollButton ? 'show' : ''}"
        @click=${this.scrollToBottom}
        aria-label="Scroll to bottom"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" transform="rotate(180 12 12)"/>
        </svg>
      </button>

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

    // Add click listener with proper reference
    document.addEventListener('click', this.documentClickHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback?.();
    
    // Remove the viewport meta tag when component is disconnected
    const meta = document.head.querySelector('meta[name="viewport"]');
    if (meta) {
      document.head.removeChild(meta);
    }

    // Remove the click listener
    document.removeEventListener('click', this.documentClickHandler);
  }

  meta() {
    return {
      title: 'Chat',
      description: 'Chat with AI',
    };
  }
}
