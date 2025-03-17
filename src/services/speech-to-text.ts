/**
 * Service for handling speech-to-text functionality
 */
export class SpeechToTextService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private serverUrl = 'http://localhost:3000'; // Server URL

  /**
   * Check if the browser supports the necessary APIs for speech recognition
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      window.MediaRecorder
    );
  }

  /**
   * Start recording audio from the microphone
   */
  async startRecording(): Promise<void> {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      console.log('Got audio stream:', stream);

      // Use WebM with Opus codec if supported
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log(`${mimeType} is not supported, falling back to default`);
        mimeType = '';
      } else {
        console.log(`Using mime type: ${mimeType}`);
      }

      this.mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      this.audioChunks = [];

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          console.log(`Received audio chunk of size: ${event.data.size} bytes`);
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.start(100); // Collect data every 100ms for smaller chunks
      console.log('MediaRecorder started with 100ms timeslice');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and transcribe the audio
   */
  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      console.log('Stopping recording...');

      this.mediaRecorder.addEventListener('stop', async () => {
        try {
          console.log(
            `Recording stopped. Collected ${this.audioChunks.length} chunks`
          );

          if (this.audioChunks.length === 0) {
            console.error('No audio data collected');
            reject(new Error('No audio data collected'));
            return;
          }

          const audioBlob = new Blob(this.audioChunks, {
            type: 'audio/webm;codecs=opus',
          });
          console.log(`Created audio blob of size: ${audioBlob.size} bytes`);

          if (audioBlob.size === 0) {
            console.error('Audio blob is empty');
            reject(new Error('Audio blob is empty'));
            return;
          }

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          console.log(
            `Sending audio to server for transcription at ${this.serverUrl}/api/transcribe...`
          );

          try {
            const response = await fetch(`${this.serverUrl}/api/transcribe`, {
              method: 'POST',
              body: formData,
              // Add CORS headers
              mode: 'cors',
              credentials: 'omit',
            });

            console.log('Server response status:', response.status);

            if (!response.ok) {
              let errorText = '';
              try {
                errorText = await response.text();
              } catch (e) {
                errorText = 'Could not read error response';
              }
              console.error('Server error response:', errorText);
              throw new Error(
                `Transcription failed: ${response.status} - ${errorText}`
              );
            }

            let data;
            try {
              data = await response.json();
              console.log('Transcription result:', data);
            } catch (e) {
              console.error('Error parsing JSON response:', e);
              throw new Error('Invalid response from server');
            }

            resolve(data.text || '');
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            // Try to save the audio for debugging
            this.saveAudioForDebugging(audioBlob);
            reject(fetchError);
          }
        } catch (error) {
          console.error('Error transcribing audio:', error);
          reject(error);
        }
      });

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }

  /**
   * Save the audio blob to a file for debugging purposes
   */
  private saveAudioForDebugging(audioBlob: Blob): void {
    try {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'debug-recording.webm';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      console.log('Debug audio saved. Please check your downloads folder.');
    } catch (e) {
      console.error('Could not save debug audio:', e);
    }
  }
}
