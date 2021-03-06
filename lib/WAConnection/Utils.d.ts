/// <reference types="node" />
import WS from 'ws';
import Decoder from '../Binary/Decoder';
import { MessageType, MessageOptions, WAChat, WAMessageContent } from './Constants';
export declare const Browsers: {
    ubuntu: (browser: any) => [string, string, string];
    macOS: (browser: any) => [string, string, string];
    baileys: (browser: any) => [string, string, string];
    /** The appropriate browser based on your OS & release */
    appropriate: (browser: any) => [string, string, string];
};
export declare const waChatUniqueKey: (c: WAChat) => number;
export declare const whatsappID: (jid: string) => string;
export declare const isGroupID: (jid: string) => boolean;
/** decrypt AES 256 CBC; where the IV is prefixed to the buffer */
export declare function aesDecrypt(buffer: Buffer, key: Buffer): Buffer;
/** decrypt AES 256 CBC */
export declare function aesDecryptWithIV(buffer: Buffer, key: Buffer, IV: Buffer): Buffer;
export declare function aesEncrypt(buffer: Buffer, key: Buffer): Buffer;
export declare function aesEncrypWithIV(buffer: Buffer, key: Buffer, IV: Buffer): Buffer;
export declare function hmacSign(buffer: Buffer, key: Buffer): Buffer;
export declare function sha256(buffer: Buffer): Buffer;
export declare function hkdf(buffer: Buffer, expandedLength: number, info?: any): Buffer;
export declare function randomBytes(length: any): Buffer;
/** unix timestamp of a date in seconds */
export declare const unixTimestampSeconds: (date?: Date) => number;
export declare const delay: (ms: number) => Promise<void>;
export declare const delayCancellable: (ms: number) => {
    delay: Promise<void>;
    cancel: () => void;
};
export declare function promiseTimeout<T>(ms: number, promise: (resolve: (v?: T) => void, reject: (error: any) => void) => void): Promise<T>;
export declare const openWebSocketConnection: (timeoutMs: number, retryOnNetworkError: boolean) => {
    ws: Promise<WS>;
    cancel: () => boolean;
};
export declare function generateMessageTag(epoch?: number): string;
export declare function generateClientID(): string;
export declare function generateMessageID(): string;
export declare function decryptWA(message: string | Buffer, macKey: Buffer, encKey: Buffer, decoder: Decoder, fromMe?: boolean): [string, Object, [number, number]?];
/** generates all the keys required to encrypt/decrypt & sign a media message */
export declare function getMediaKeys(buffer: any, mediaType: MessageType): {
    iv: Buffer;
    cipherKey: Buffer;
    macKey: Buffer;
};
export declare const compressImage: (buffer: Buffer) => Promise<Buffer>;
export declare const generateProfilePicture: (buffer: Buffer) => Promise<{
    img: Buffer;
    preview: Buffer;
}>;
/** generates a thumbnail for a given media, if required */
export declare function generateThumbnail(buffer: Buffer, mediaType: MessageType, info: MessageOptions): Promise<void>;
/**
 * Decode a media message (video, image, document, audio) & return decrypted buffer
 * @param message the media message you want to decode
 */
export declare function decodeMediaMessageBuffer(message: WAMessageContent, fetchHeaders?: {
    [k: string]: string;
}): Promise<Buffer>;
export declare function extensionForMediaMessage(message: WAMessageContent): string;
