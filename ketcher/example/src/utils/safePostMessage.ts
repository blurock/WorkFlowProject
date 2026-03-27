/**
 * Safely sends a postMessage to parent window with proper error handling.
 * When running inside a cross-origin iframe (e.g. Angular on :4200 embedding
 * Ketcher on :4002), window.parent.location.origin is not readable, so we
 * fall back to '*' to allow any parent origin to receive the message.
 * @param message - The message to send
 */
export const safePostMessage = (message: Record<string, unknown>): void => {
  if (window.parent === window) return;

  let parentOrigin = '*';
  try {
    const origin = window.parent.location.origin;
    if (origin && origin !== 'null' && origin !== 'undefined') {
      parentOrigin = origin;
    }
  } catch {
    // Cross-origin: parent origin is not readable, use '*'
    parentOrigin = '*';
  }

  window.parent.postMessage(message, parentOrigin);
};
