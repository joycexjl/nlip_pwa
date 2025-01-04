/**
 * Network utilities for communicating with the backend server
 */

const BASE_URL = 'https://druid.eecs.umich.edu';
const API_ENDPOINTS = {
  auth: `${BASE_URL}/auth`,
  nlip: `${BASE_URL}/nlip`,
  upload: `${BASE_URL}/upload`,
};

interface Message {
  format: 'text' | 'binary';
  subformat: string;
  content: string;
}

interface NLIPRequest {
  format: 'text';
  subformat: string;
  content: string;
  submessages?: Message[];
}

interface APIResponse {
  response: string;
  // Add other response fields if needed
}

/**
 * Get authentication URL for a specific provider
 */
export async function getAuthUrl(): Promise<string> {
  try {
    const response = await fetch(API_ENDPOINTS.auth);
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
  const request: NLIPRequest = {
    format: 'text',
    subformat: 'english',
    content: text,
  };

  try {
    const response = await fetch(API_ENDPOINTS.nlip, {
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
    return data.response;
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
  // Extract the image format from the MIME type (e.g., 'image/jpeg' -> 'jpeg')
  const imageFormat = mimeType.split('/')[1];

  const request: NLIPRequest = {
    format: 'text',
    subformat: 'english',
    content: prompt || 'Describe this picture',
    submessages: [
      {
        format: 'binary',
        subformat: imageFormat,
        content: base64Image,
      },
    ],
  };

  try {
    const response = await fetch(API_ENDPOINTS.nlip, {
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
    return data.response;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
}

/**
 * Upload a file using form data
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(API_ENDPOINTS.upload, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.url; // Assuming the server returns the URL of the uploaded file
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
