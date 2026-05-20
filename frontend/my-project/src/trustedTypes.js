const GOOGLE_IDENTITY_ORIGIN = 'https://accounts.google.com';

function isAllowedScriptUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin || url.origin === GOOGLE_IDENTITY_ORIGIN;
  } catch {
    return false;
  }
}

export function installTrustedTypesPolicy() {
  if (!window.trustedTypes) {
    return;
  }

  try {
    window.trustedTypes.createPolicy('default', {
      createScriptURL(value) {
        if (isAllowedScriptUrl(value)) {
          return value;
        }

        throw new TypeError(`Blocked untrusted script URL: ${value}`);
      },
    });
  } catch (error) {
    if (!String(error?.message || error).includes('already exists')) {
      console.warn('Unable to install Trusted Types policy:', error);
    }
  }
}
