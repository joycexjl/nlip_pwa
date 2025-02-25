import { setAuthToken } from './network.js';

/**
 * Handle the authentication callback from Google
 */
export function handleAuthCallback() {
  // Get the current URL
  const url = new URL(window.location.href);

  // Check if this is an auth callback
  if (!url.pathname.includes('/auth/callback')) {
    return;
  }

  // Parse the response data
  try {
    const responseData = JSON.parse(decodeURIComponent(url.hash.substring(1)));

    // Store the access token and expiration
    setAuthToken(responseData.AccessToken, responseData.ExpiresAt);

    // Get the return URL and pending message
    const returnUrl = sessionStorage.getItem('returnUrl') || '/';
    const pendingMessage = sessionStorage.getItem('pendingMessage');
    const pendingUpload = sessionStorage.getItem('pendingUpload');

    // Clear the stored data
    sessionStorage.removeItem('returnUrl');
    sessionStorage.removeItem('pendingMessage');
    sessionStorage.removeItem('pendingUpload');

    // If we have pending data, restore it
    if (pendingMessage || pendingUpload) {
      if (pendingUpload) {
        const uploadData = JSON.parse(pendingUpload);
        if (uploadData.imageData) {
          sessionStorage.setItem(
            'pendingImageData',
            JSON.stringify(uploadData.imageData)
          );
        }
        if (uploadData.documentData && uploadData.documentContent) {
          sessionStorage.setItem(
            'pendingDocumentData',
            JSON.stringify(uploadData.documentData)
          );
          sessionStorage.setItem(
            'pendingDocumentContent',
            uploadData.documentContent
          );
        }
      }

      // Store the message to be restored after navigation
      if (pendingMessage) {
        sessionStorage.setItem('restoreMessage', pendingMessage);
      }
    }

    // Redirect back to the original page
    window.location.href = returnUrl;
  } catch (error) {
    console.error('Error handling auth callback:', error);
    // Redirect to home page on error
    window.location.href = '/';
  }
}

// Call handleAuthCallback when the script loads
handleAuthCallback();
