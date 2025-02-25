/**
 * Network utilities for communicating with the backend server
 */

// import { envSignal } from '../context/app-context.js';

const BASE_URL = 'https://druid.eecs.umich.edu';
// const BASE_URL = 'https://localhost:443'; // for testing largedataupload locally
const API_ENDPOINTS = {
  auth: `${BASE_URL}/auth`,
  nlip: `${BASE_URL}/nlip`,
  upload: `${BASE_URL}/upload`,
};

type Format =
  | 'text'
  | 'binary'
  | 'authentication'
  | 'structured'
  | 'location'
  | 'generic';
type Subformat = 'english' | 'jpeg' | 'jpg' | 'png' | 'gif' | 'bmp';

interface Message {
  format: Format;
  subformat: Subformat;
  content: string;
  submessages?: Message[];
}

interface APIResponse {
  format: Format;
  subformat: Subformat;
  content: string;
}

interface AuthResponse {
  AccessToken: string;
  ExpiresAt: string;
}

// Store the access token in memory
let accessToken: string | null = null;
let tokenExpiresAt: Date | null = null;

/**
 * Set the access token and its expiration
 */
export function setAuthToken(token: string, expiresAt: string) {
  accessToken = token;
  tokenExpiresAt = new Date(expiresAt);
}

/**
 * Check if the current token is valid
 */
async function isTokenValid(): Promise<boolean> {
  if (!accessToken || !tokenExpiresAt) {
    return false;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  if (now.getTime() + bufferTime >= tokenExpiresAt.getTime()) {
    return false;
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.auth}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

/**
 * Ensure user is authenticated before making a request
 */
async function ensureAuthenticated(): Promise<void> {
  if (!(await isTokenValid())) {
    // Clear invalid token
    accessToken = null;
    tokenExpiresAt = null;

    // Save current URL and any pending message
    sessionStorage.setItem('returnUrl', window.location.href);

    // Save current page state if we're in the chat
    if (window.location.pathname === '/chat') {
      const chatInput = document.querySelector(
        '.chat-input'
      ) as HTMLTextAreaElement;
      if (chatInput?.value) {
        sessionStorage.setItem('pendingMessage', chatInput.value);
      }

      // Save any pending image or document data
      const pendingImageData = sessionStorage.getItem('pendingImageData');
      const pendingDocumentData = sessionStorage.getItem('pendingDocumentData');
      const pendingDocumentContent = sessionStorage.getItem(
        'pendingDocumentContent'
      );

      if (pendingImageData || (pendingDocumentData && pendingDocumentContent)) {
        sessionStorage.setItem(
          'pendingUpload',
          JSON.stringify({
            imageData: pendingImageData ? JSON.parse(pendingImageData) : null,
            documentData: pendingDocumentData
              ? JSON.parse(pendingDocumentData)
              : null,
            documentContent: pendingDocumentContent || null,
          })
        );
      }
    }

    window.location.href = `${API_ENDPOINTS.auth}/`;
  }
}

/**
 * Get authentication URL for a specific provider
 */
export async function getAuthUrl(): Promise<string> {
// provider: 'google' | 'custom' = 'google'
  try {
    // const response = await fetch(`${API_ENDPOINTS.auth}/${provider}/`);
    const response = await fetch(`${API_ENDPOINTS.auth}/`); // for testing current auth
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
}

/**
 * Send a text message to the NLIP endpoint
 */
export async function sendTextMessage(text: string): Promise<string> {
  await ensureAuthenticated();

  const request: Message = {
    format: 'text',
    subformat: 'english',
    content: text,
  };

  try {
    const response = await fetch(`${API_ENDPOINTS.nlip}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: APIResponse = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

/**
 * Send an image with an optional prompt to the NLIP endpoint
 */
export async function sendImageMessage(
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string> {
  await ensureAuthenticated();

  const imageFormat = mimeType.split('/')[1].toLowerCase() as Subformat;

  // Validate image format
  if (!['jpeg', 'jpg', 'png', 'gif', 'bmp'].includes(imageFormat)) {
    throw new Error(
      'Unsupported image format. Please use JPEG, PNG, GIF, or BMP.'
    );
  }

  const request: Message = {
    format: 'text',
    subformat: 'english',
    content: prompt || 'What do you see in this image?',
    submessages: [
      {
        format: 'binary',
        subformat: imageFormat,
        content: base64Image,
      },
    ],
  };

  try {
    const response = await fetch(`${API_ENDPOINTS.nlip}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: APIResponse = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
}

/**
 * Upload a file to the server
 * Returns the response data from the server
 */
export async function handleFileUpload(
  file: File
): Promise<{ message?: string; url?: string }> {
  await ensureAuthenticated();

  try {
    // First, get the upload URL
    const response = await fetch(`${API_ENDPOINTS.nlip}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content: 'request_upload_url',
        Format: 'text',
        Subformat: 'english',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const data = await response.json();
    const uploadUrl = data.content;

    // Now upload the file
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse
        .text()
        .catch(() => 'Unknown error');
      throw new Error(`Upload failed: ${errorText}`);
    }

    const responseData = await uploadResponse.json().catch(() => null);
    return {
      // message: `Successfully uploaded ${file.name}!`,
      url: responseData?.url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
