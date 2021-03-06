import { WA } from '../Binary/Constants'
import { proto } from '../../WAMessage/WAMessage'

export const KEEP_ALIVE_INTERVAL_MS = 20*1000

// export the WAMessage Prototypes
export { proto as WAMessageProto }
export type WANode = WA.Node
export type WAMessage = proto.WebMessageInfo
export type WAMessageContent = proto.IMessage
export type WAContactMessage = proto.ContactMessage
export type WAMessageKey = proto.IMessageKey
export type WATextMessage = proto.ExtendedTextMessage
export type WAContextInfo = proto.IContextInfo
export import WA_MESSAGE_STUB_TYPE = proto.WebMessageInfo.WEB_MESSAGE_INFO_STUBTYPE
export import WA_MESSAGE_STATUS_TYPE = proto.WebMessageInfo.WEB_MESSAGE_INFO_STATUS

export interface WALocationMessage {
    degreesLatitude: number
    degreesLongitude: number
    address?: string
}
/** Reverse stub type dictionary */
export const WA_MESSAGE_STUB_TYPES = function () {
    const types = WA_MESSAGE_STUB_TYPE
    const dict: Record<number, string> = {}
    Object.keys(types).forEach(element => dict[ types[element] ] = element)
    return dict
}()

export class BaileysError extends Error {
    status?: number
    context: any

    constructor (message: string, context: any) {
        super (message)
        this.name = 'BaileysError'
        this.status = context.status
        this.context = context
    }
}
export const TimedOutError = () => new BaileysError ('timed out', { status: 408 })
export const CancelledError = () => new BaileysError ('cancelled', { status: 500 })

export interface WAQuery {
    json: any[] | WANode
    binaryTags?: WATag
    timeoutMs?: number
    tag?: string
    expect200?: boolean
    waitForOpen?: boolean
}
export enum ReconnectMode {
    /** does not reconnect */
    off = 0,
    /** reconnects only when the connection is 'lost' or 'close' */
    onConnectionLost = 1,
    /** reconnects on all disconnects, including take overs */
    onAllErrors = 2
}
export type WAConnectOptions = {
    /** timeout after which the connect attempt will fail, set to null for default timeout value */
    timeoutMs?: number
    /** maximum attempts to connect */
    maxRetries?: number
    /** should the chats be waited for */
    waitForChats?: boolean

    connectCooldownMs?: number
}

export type WAConnectionState = 'open' | 'connecting' | 'close'

export const UNAUTHORIZED_CODES = [401, 419]
/** Types of Disconnect Reasons */
export enum DisconnectReason {
  /** The connection was closed intentionally */
  intentional = 'intentional',
  /** The connection was terminated either by the client or server */
  close = 'close',
  /** The connection was lost, called when the server stops responding to requests */
  lost = 'lost',
  /** When WA Web is opened elsewhere & this session is disconnected */
  replaced = 'replaced',
  /** The credentials for the session have been invalidated, i.e. logged out either from the phone or WA Web */
  invalidSession = 'invalid_session',
  /** Received a 500 result in a query -- something has gone very wrong */
  badSession = 'bad_session',
  /** No idea, can be a sign of log out too */
  unknown = 'unknown',
  /** Well, the connection timed out */
  timedOut = 'timed out'
}
export enum MessageLogLevel {
    none=0,
    info=1,
    unhandled=2,
    all=3
}
export interface AuthenticationCredentials {
    clientID: string
    serverToken: string
    clientToken: string
    encKey: Buffer
    macKey: Buffer
}
export interface AuthenticationCredentialsBase64 {
    clientID: string
    serverToken: string
    clientToken: string
    encKey: string
    macKey: string
}
export interface AuthenticationCredentialsBrowser {
    WABrowserId: string
    WASecretBundle: {encKey: string, macKey: string} | string
    WAToken1: string
    WAToken2: string
}
export type AnyAuthenticationCredentials = AuthenticationCredentialsBrowser | AuthenticationCredentialsBase64 | AuthenticationCredentials

export interface WAGroupCreateResponse {
    status: number
    gid?: string
    participants?: [{ [key: string]: any }]
}
export interface WAGroupMetadata {
    id: string
    owner: string
    subject: string
    creation: number
    desc?: string
    descOwner?: string
    descId?: string
    /** is set when the group only allows admins to change group settings */
    restrict?: 'true' 
    /** is set when the group only allows admins to write messages */
    announce?: 'true' 
    participants: [{ id: string; isAdmin: boolean; isSuperAdmin: boolean }]
}
export interface WAGroupModification {
    status: number
    participants?: { [key: string]: any }
}

export interface WAContact {
    /** name of the contact, the contact has set on their own on WA */
    notify?: string
    jid: string
    /** I have no idea */
    vname?: string
    /** name of the contact, you have saved on your WA */
    name?: string
    index?: string
    /** short name for the contact */
    short?: string
}
export interface WAUser extends WAContact {
    phone: any
    imgUrl?: string
}
export interface WAChat {
    jid: string

    t: number
    /** number of unread messages, is < 0 if the chat is manually marked unread */
    count: number
    archive?: 'true' | 'false'
    read_only?: 'true' | 'false'
    mute?: string
    pin?: string
    spam: 'false' | 'true'
    modify_tag: string
    name?: string
    
    // Baileys added properties
    messages: WAMessage[]
    imgUrl?: string
}
export enum WAMetric {
    debugLog = 1,
    queryResume = 2,
    liveLocation = 3,
    queryMedia = 4,
    queryChat = 5,
    queryContact = 6,
    queryMessages = 7,
    presence = 8,
    presenceSubscribe = 9,
    group = 10,
    read = 11,
    chat = 12,
    received = 13,
    picture = 14,
    status = 15,
    message = 16,
    queryActions = 17,
    block = 18,
    queryGroup = 19,
    queryPreview = 20,
    queryEmoji = 21,
    queryVCard = 29,
    queryStatus = 30,
    queryStatusUpdate = 31,
    queryLiveLocation = 33,
    queryLabel = 36,
    queryQuickReply = 39
}

export const STORIES_JID = 'status@broadcast'

export enum WAFlag {
    ignore = 1 << 7,
    acknowledge = 1 << 6,
    available = 1 << 5,
    unavailable = 1 << 4,
    expires = 1 << 3,
    skipOffline = 1 << 2,
}
/** Tag used with binary queries */
export type WATag = [WAMetric, WAFlag]

/** set of statuses visible to other people; see updatePresence() in WhatsAppWeb.Send */
export enum Presence {
    available = 'available', // "online"
    unavailable = 'unavailable', // "offline"
    composing = 'composing', // "typing..."
    recording = 'recording', // "recording..."
    paused = 'paused', // I have no clue
}
/** Set of message types that are supported by the library */
export enum MessageType {
    text = 'conversation',
    extendedText = 'extendedTextMessage',
    contact = 'contactMessage',
    location = 'locationMessage',
    liveLocation = 'liveLocationMessage',

    image = 'imageMessage',
    video = 'videoMessage',
    sticker = 'stickerMessage',
    document = 'documentMessage',
    audio = 'audioMessage',
    product = 'productMessage'
}
export enum ChatModification {
    archive='archive',
    unarchive='unarchive',
    pin='pin',
    unpin='unpin',
    mute='mute',
    unmute='unmute'
}
export const HKDFInfoKeys = {
    [MessageType.image]: 'WhatsApp Image Keys',
    [MessageType.audio]: 'WhatsApp Audio Keys',
    [MessageType.video]: 'WhatsApp Video Keys',
    [MessageType.document]: 'WhatsApp Document Keys',
    [MessageType.sticker]: 'WhatsApp Image Keys'
}
export enum Mimetype {
    jpeg = 'image/jpeg',
    png = 'image/png',
    mp4 = 'video/mp4',
    gif = 'video/gif',
    pdf = 'application/pdf',
    ogg = 'audio/ogg; codecs=opus',
    /** for stickers */
    webp = 'image/webp',
}
export interface MessageOptions {
    quoted?: WAMessage
    contextInfo?: WAContextInfo
    timestamp?: Date
    caption?: string
    thumbnail?: string
    mimetype?: Mimetype | string
    filename?: string
}
export interface WABroadcastListInfo {
    status: number
    name: string
    recipients?: {id: string}[]
}
export interface WAUrlInfo {
    'canonical-url': string
    'matched-text': string
    title: string
    description: string
    jpegThumbnail?: Buffer
}
export interface WAProfilePictureChange {
    status: number
    tag: string
    eurl: string
}
export interface MessageInfo {
    reads: {jid: string, t: string}[]
    deliveries: {jid: string, t: string}[]
}
export interface WAMessageStatusUpdate {
    from: string
    to: string
    /** Which participant caused the update (only for groups) */
    participant?: string
    timestamp: Date
    /** Message IDs read/delivered */
    ids: string[]
    /** Status of the Message IDs */
    type: WA_MESSAGE_STATUS_TYPE
}
export enum GroupSettingChange {
    messageSend = 'announcement',
    settingsChange = 'locked',
}
export interface PresenceUpdate {
    id: string
    participant?: string
    t?: string
    type?: Presence
    deny?: boolean
}
// path to upload the media
export const MediaPathMap = {
    imageMessage: '/mms/image',
    videoMessage: '/mms/video',
    documentMessage: '/mms/document',
    audioMessage: '/mms/audio',
    stickerMessage: '/mms/image',
}
// gives WhatsApp info to process the media
export const MimetypeMap = {
    imageMessage: Mimetype.jpeg,
    videoMessage: Mimetype.mp4,
    documentMessage: Mimetype.pdf,
    audioMessage: Mimetype.ogg,
    stickerMessage: Mimetype.webp,
}
export interface WASendMessageResponse {
    status: number
    messageID: string
    message: WAMessage
}
export type BaileysEvent = 
    'open' | 
    'connecting' |
    'close' |
    'qr' |
    'connection-phone-change' |
    'user-presence-update' |
    'user-status-update' |
    'chat-new' |
    'chat-update' |
    'message-new' |
    'message-update' |
    'message-status-update' |
    'group-participants-add' |
    'group-participants-remove' |
    'group-participants-promote' |
    'group-participants-demote' |
    'group-settings-update' |
    'group-description-update'