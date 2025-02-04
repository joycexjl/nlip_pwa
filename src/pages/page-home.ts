/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignalWatcher } from '@lit-labs/signals';
import { Router } from '@vaadin/router';
import { html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { PageElement } from '../helpers/page-element.js';
import { chatInputStyles } from '../styles/chat-input.js';

@customElement('page-home')
export class PageHome extends SignalWatcher(PageElement) {
  @query('#text-input') textInput?: HTMLTextAreaElement;
  @query('#image-input') imageInput?: HTMLInputElement;
  @query('#image-prompt') imagePrompt?: HTMLTextAreaElement;
  @state() private isRecording = false;
  @state() private showUploadMenu = false;

  static styles = css`
    ${chatInputStyles}
    
    :host {
      display: block;
      box-sizing: border-box;
      min-height: 100vh;
      padding: 16px;
      background: #f8fafc;
      color: #1e293b;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
    }

    .logo {
      color: #2563eb;
      font-size: 24px;
    }

    .user-avatar {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      font-weight: 500;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
      margin-top: 32px;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      margin: 24px 0;
    }

    .action-button {
      display: flex;
      flex: 1;
      gap: 8px;
      align-items: center;
      padding: 16px;
      border: none;
      border-radius: 12px;
      background: white;
      color: #1e293b;
      box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-button:hover {
      background: #f8fafc;
      box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
      transform: translateY(-1px);
    }

    .action-button svg {
      width: 24px;
      height: 24px;
      color: #2563eb;
    }

    .title-section {
      margin: 0 0 16px;
    }

    .title {
      margin: 0;
      color: #0f172a;
      font-weight: 600;
      font-size: clamp(32px, 6vw, 48px);
      line-height: 1.2;
    }

    .title span {
      color: #2563eb;
    }

    .search-section {
      display: none; /* Hide the inline search */
    }

    .quick-prompts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }

    .prompt-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 24px;
      border: none;
      border-radius: 16px;
      background: white;
      color: #1e293b;
      box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }

    .prompt-card:hover, .prompt-card:focus {
      background: white;
      box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }

    .prompt-card:focus {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    .prompt-icon {
      width: 32px;
      height: 32px;
      margin-bottom: 16px;
      color: #2563eb;
    }

    .prompt-title {
      margin: 0;
      color: #1e293b;
      font-weight: 500;
      font-size: 18px;
    }

    @media (max-width: 640px) {
      .quick-actions {
        flex-direction: column;
      }

      .prompt-card {
        padding: 20px;
      }
    }

    @media (min-width: 1024px) {
      .main-content {
        gap: 48px;
      }

      .quick-prompts {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
    }

    .upload-menu {
      position: absolute;
      right: 0;
      bottom: 100%;
      margin-bottom: 8px;
      padding: 8px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s ease;
      transform: translateY(10px);
    }

    .upload-menu.show {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .upload-option {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: none;
      color: #1e293b;
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .upload-option:hover {
      background: #f1f5f9;
    }

    .upload-option svg {
      width: 20px;
      height: 20px;
      color: #64748b;
    }
  `;

  render() {
    return html`
      <div class="container">
        <div class="header">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2zm0 2.84L19.5 12h-1.5v8h-4v-6H10v6H6v-8H4.5L12 4.84z"/>
            </svg>
          </div>
          <div class="user-avatar">M</div>
        </div>

        <div class="main-content">
          <div class="quick-actions">
            <button class="action-button" @click=${() => window.location.href = '/scan'}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z"/>
              </svg>
              Scan QR
            </button>
            <button class="action-button" @click=${() => window.location.href = '/map'}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
              </svg>
              Map
            </button>
          </div>

          <div class="title-section">
            <h1 class="title">Ask <span>anything</span> you need help with.</h1>
          </div>

          <div class="quick-prompts">
            <button 
              class="prompt-card"
              @click=${() => this.navigateToChat("I need a secure AI diagnosis.")}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.navigateToChat("I need a secure AI diagnosis.");
                }
              }}
            >
              <svg class="prompt-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
              </svg>
              <h3 class="prompt-title">I need a secure AI diagnosis.</h3>
            </button>

            <button 
              class="prompt-card"
              @click=${() => this.navigateToChat("I want a combined market analysis.")}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.navigateToChat("I want a combined market analysis.");
                }
              }}
            >
              <svg class="prompt-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
              </svg>
              <h3 class="prompt-title">I want a combined market analysis.</h3>
            </button>

            <button 
              class="prompt-card"
              @click=${() => this.navigateToChat("Find me the best shampoo.")}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.navigateToChat("Find me the best shampoo.");
                }
              }}
            >
              <svg class="prompt-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 20c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-3H7v3zM18 7c-.55 0-1 .45-1 1v5H7V8c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1zm-3-5H9C6.79 2 5 3.79 5 6v1h2V6c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v1h2V6c0-2.21-1.79-4-4-4z"/>
              </svg>
              <h3 class="prompt-title">Find me the best shampoo.</h3>
            </button>

            <button 
              class="prompt-card"
              @click=${() => this.navigateToChat("I want insights into this project.")}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.navigateToChat("I want insights into this project.");
                }
              }}
            >
              <svg class="prompt-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
              <h3 class="prompt-title">I want insights into this project.</h3>
            </button>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <div class="chat-input-wrapper">
          <button
            class="voice-input-button ${this.isRecording ? 'recording' : ''}"
            @click=${() => this.isRecording ? this.stopVoiceInput() : this.startVoiceInput()}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              ${this.isRecording 
                ? html`<path d="M12 2c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-1.66-1.34-3-3-3zm-1 11.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V19h4v2H8v-2h4v-5.07z"></path>`
                : html`<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"></path>`}
            </svg>
          </button>
          <textarea
            class="chat-input"
            placeholder="Type your message here..."
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const input = e.target as HTMLTextAreaElement;
                this.navigateToChat(input.value);
              }
            }}
          ></textarea>
          <div class="button-group">
            <div style="position: relative;">
              <button
                class="image-upload-button"
                @click=${() => this.toggleUploadMenu()}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
              </button>

              <div class="upload-menu ${this.showUploadMenu ? 'show' : ''}">
                <button class="upload-option" @click=${() => this.handleImageSelect()}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  Upload Image
                </button>
                <button class="upload-option" @click=${() => this.handleImageSelect()}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                  Upload Document
                </button>
              </div>
            </div>

            <button class="send-button" @click=${() => {
              const input = this.renderRoot?.querySelector('.chat-input') as HTMLTextAreaElement;
              if (input?.value) {
                this.navigateToChat(input.value);
              }
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];

  private async startVoiceInput() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioChunks = [];
        stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
        // Here you would typically send the audioBlob to your speech-to-text service
        // For now, we'll just show a message
        console.log('Speech-to-text conversion not implemented yet');
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  private stopVoiceInput() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  private navigateToChat(prompt?: string) {
    if (prompt) {
      sessionStorage.setItem('chatData', JSON.stringify({
        userPrompt: prompt,
        aiResponse: ''
      }));
    }
    Router.go('/chat');
  }

  private handleImageSelect() {
    this.imageInput?.click();
  }

  private async handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/bmp'].includes(file.type)) {
      console.error('Please select a valid image file (JPEG, PNG, GIF, or BMP)');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const base64Image = (e.target.result as string).split(',')[1];
        const prompt = 'What do you see in this image?';

        sessionStorage.setItem('chatData', JSON.stringify({
          userPrompt: `Image uploaded with prompt: ${prompt}`,
          imageData: e.target.result,
          imageType: file.type
        }));

        Router.go('/chat');
      }
    };
    reader.readAsDataURL(file);
  }

  private closeUploadMenu = (e: MouseEvent) => {
    if (!(e.target as Element).closest('.button-group')) {
      this.showUploadMenu = false;
      document.removeEventListener('click', this.closeUploadMenu);
    }
  };

  private toggleUploadMenu() {
    this.showUploadMenu = !this.showUploadMenu;
    if (this.showUploadMenu) {
      // Add click listener with a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', this.closeUploadMenu);
      });
    }
  }

  meta() {
    return {
      title: 'Home',
      description: 'Home page',
    };
  }
}
