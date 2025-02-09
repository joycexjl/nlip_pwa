/**
 * Network utilities for communicating with the backend server
 */

// import { envSignal } from '../context/app-context.js';

const BASE_URL = 'https://druid.eecs.umich.edu';
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

/**
 * Get authentication URL for a specific provider
 */
export async function getAuthUrl(
  provider: 'google' | 'custom' = 'google'
): Promise<string> {
  try {
    const response = await fetch(`${API_ENDPOINTS.auth}/${provider}/`);
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
  try {
    // First, get the upload URL
    const response = await fetch(`${API_ENDPOINTS.nlip}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      message: responseData?.message || `Successfully uploaded ${file.name}!`,
      url: responseData?.url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
