/* stylelint-disable */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface OVONEnvelope {
  ovon: {
    schema: {
      version: string;
    };
    conversation: {
      id: string;
    };
    sender: {
      speakerUri: string;
      serviceUrl: string;
    };
    events: Array<{
      eventType: string;
      parameters?: {
        dialogEvent?: {
          speakerUri: string;
          span: {
            startTime: string;
          };
          features: {
            text?: {
              mimeType: string;
              tokens: Array<{ value: string }>;
            };
            audio?: {
              mimeType: string;
              tokens: Array<{ value: string }>;
            };
          };
        };
      };
    }>;
  };
}

@customElement('streaming-transcribe')
export class StreamingTranscribe extends LitElement {
  @property({ type: Boolean }) hideUI = false;
  @state() private isRecording = false;
  @state() private isTranscribing = false;
  @state() private currentTranscript = '';
  @state() private isFinal = false;

  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private eventSource: EventSource | null = null;
  private sessionId: string | null = null;

  constructor() {
    super();
    this.sessionId = Math.random().toString(36).substring(7);
  }

  private createOVONEnvelope(eventType: string, content: any): OVONEnvelope {
    return {
      ovon: {
        schema: { version: '0.9.4' },
        conversation: { id: this.sessionId! },
        sender: {
          speakerUri: 'tag:nlip-client,2025:0001',
          serviceUrl: 'http://localhost:8000',
        },
        events: [
          {
            eventType,
            parameters: {
              dialogEvent: {
                speakerUri: 'tag:nlip-client,2025:0001',
                span: { startTime: new Date().toISOString() },
                features: content,
              },
            },
          },
        ],
      },
    };
  }

  async startRecording() {
    try {
      // Set up SSE connection first
      this.eventSource = new EventSource(
        `http://localhost:3000/stream/${this.sessionId}`
      );

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        this.eventSource!.addEventListener('open', () => {
          clearTimeout(connectionTimeout);
          resolve(true);
        });

        this.eventSource!.addEventListener('error', (event) => {
          clearTimeout(connectionTimeout);
          reject(new Error('Failed to establish SSE connection'));
        });

        this.eventSource!.addEventListener('message', (event) => {
          const envelope: OVONEnvelope = JSON.parse(event.data);
          const transcriptionEvent = envelope.ovon.events[0];

          if (transcriptionEvent?.parameters?.dialogEvent?.features?.text) {
            const transcript =
              transcriptionEvent.parameters.dialogEvent.features.text.tokens[0]
                .value;
            this.currentTranscript = transcript;
            this.isFinal = true; // You might want to modify this based on your needs
            this.dispatchEvent(
              new CustomEvent('transcription-update', {
                detail: {
                  transcript: this.currentTranscript,
                  isFinal: this.isFinal,
                },
              })
            );
          }
        });
      });

      // Start the stream on the server
      const startEnvelope = this.createOVONEnvelope('utterance', {
        text: {
          mimeType: 'text/plain',
          tokens: [{ value: 'Start transcription' }],
        },
      });

      await fetch(`http://localhost:3000/start/${this.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(startEnvelope),
      });

      // Set up audio recording
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            if (base64Audio) {
              const audioEnvelope = this.createOVONEnvelope('utterance', {
                audio: {
                  mimeType: 'audio/webm;codecs=opus',
                  tokens: [{ value: base64Audio }],
                },
              });

              await fetch(`http://localhost:3000/audio/${this.sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(audioEnvelope),
              });
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      this.mediaRecorder.start(100); // Send chunks every 100ms
      this.isRecording = true;
      this.isTranscribing = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      throw error;
    }
  }

  async stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      this.isRecording = false;
      this.isTranscribing = false;

      // Stop the stream on the server
      const stopEnvelope = this.createOVONEnvelope('utterance', {
        text: {
          mimeType: 'text/plain',
          tokens: [{ value: 'Stop transcription' }],
        },
      });

      await fetch(`http://localhost:3000/stop/${this.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stopEnvelope),
      });

      // Close SSE connection
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    }
  }

  render() {
    if (this.hideUI) {
      return html``;
    }

    return html`
      <div class="container">
        <button
          class="record-button ${this.isRecording ? 'recording' : ''}"
          @click=${this.isRecording ? this.stopRecording : this.startRecording}
        >
          ${this.isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        ${this.isTranscribing
          ? html`
              <div class="transcription ${this.isFinal ? 'final' : ''}">
                ${this.currentTranscript || 'Listening...'}
              </div>
            `
          : ''}
      </div>
    `;
  }

  static styles = css`
    .container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .record-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .record-button:hover {
      background-color: #0056b3;
    }

    .record-button.recording {
      background-color: #dc3545;
      animation: pulse 1.5s infinite;
    }

    .transcription {
      min-height: 2rem;
      padding: 0.5rem;
      border-radius: 4px;
      background-color: #f8f9fa;
    }

    .transcription.final {
      background-color: #e9ecef;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }
  `;
}
