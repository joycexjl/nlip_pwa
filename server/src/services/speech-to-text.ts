import { SpeechClient, protos } from '@google-cloud/speech';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '../../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log the current directory and environment variables
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Get the absolute path to the credentials file
const credentialsPath = path.join(
  __dirname,
  '../../../nlip-pwa-89f5620f7edd.json'
);

// Check if the credentials file exists
try {
  fs.accessSync(credentialsPath, fs.constants.R_OK);
  console.log('Using Google Cloud credentials from:', credentialsPath);
} catch (error) {
  console.error('Error accessing credentials file:', error);
  console.log('Attempting to use environment variable instead');
}

// Set the environment variable for Google Cloud credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

// Log environment variables
console.log('Environment variables loaded');
console.log(
  'GOOGLE_APPLICATION_CREDENTIALS:',
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
console.log('Current working directory:', process.cwd());

// Create a client instance
const client = new SpeechClient();

/**
 * Transcribe audio from a file buffer
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    console.log(`Received audio buffer of size: ${audioBuffer.length} bytes`);

    // Save the audio buffer to a file for debugging
    const debugFilePath = path.join(process.cwd(), 'debug-audio.webm');
    fs.writeFileSync(debugFilePath, audioBuffer);
    console.log(`Saved debug audio to: ${debugFilePath}`);

    // Convert Buffer to base64
    const audioBytes = audioBuffer.toString('base64');
    console.log(`Converted to base64 string of length: ${audioBytes.length}`);

    // Configure the request
    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding:
          protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
            .WEBM_OPUS,
        sampleRateHertz: 48000, // Try a different sample rate
        languageCode: 'en-US',
        model: 'default',
        enableAutomaticPunctuation: true,
        useEnhanced: true, // Use enhanced model
      },
    };

    console.log(
      'Sending request to Google Speech-to-Text API with config:',
      JSON.stringify(request.config)
    );

    // Detects speech in the audio file
    console.log('Calling Google Speech-to-Text API...');
    const [response] = await client.recognize(request);
    console.log(
      'Received response from Google Speech-to-Text API:',
      JSON.stringify(response)
    );

    if (!response.results || response.results.length === 0) {
      console.log('No transcription results returned');
      return '';
    }

    const transcription = response.results
      ?.map(
        (result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => {
          console.log('Result alternative:', result.alternatives?.[0]);
          return result.alternatives?.[0]?.transcript;
        }
      )
      .filter(Boolean)
      .join('\n');

    console.log('Final transcription:', transcription);
    return transcription || '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}
