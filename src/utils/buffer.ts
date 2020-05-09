import { TextDecoder as polifyTextDecoder } from '@exodus/text-encoding-utf8';
/**
 * Convert a UTF-8 encoded buffer into a string. This will read the full buffer as UTF-8 encoded
 * string and return anything before the first NULL character. The output text is trimmed of any
 * preceding or following spaces.
 *
 * @param {Buffer} buffer - The input buffer
 */
export const getStringFromBuffer = (buffer: Uint8Array): string => {
  const decoded = (!!TextDecoder ? new TextDecoder('utf8') : new polifyTextDecoder('utf-8')).decode(buffer);
  return decoded.split(/\0/)[0].trim();
};
