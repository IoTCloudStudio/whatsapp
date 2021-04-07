"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAConnection = void 0;
const Utils = __importStar(require("./Utils"));
const Constants_1 = require("./Constants");
const _1_Validation_1 = require("./1.Validation");
const Decoder_1 = __importDefault(require("../Binary/Decoder"));
class WAConnection extends _1_Validation_1.WAConnection {
    /** Connect to WhatsApp Web */
    async connect() {
        // if we're already connected, throw an error
        if (this.state !== 'close')
            throw new Error('cannot connect when state=' + this.state);
        const options = this.connectOptions;
        this.state = 'connecting';
        this.emit('connecting');
        let tries = 0;
        while (this.state === 'connecting') {
            tries += 1;
            try {
                const diff = this.lastConnectTime ? new Date().getTime() - this.lastConnectTime.getTime() : Infinity;
                await this.connectInternal(options, diff > this.connectOptions.connectCooldownMs ? 0 : this.connectOptions.connectCooldownMs);
                this.phoneConnected = true;
                this.state = 'open';
            }
            catch (error) {
                const loggedOut = error instanceof Constants_1.BaileysError && Constants_1.UNAUTHORIZED_CODES.includes(error.status);
                const willReconnect = !loggedOut && (tries <= ((options === null || options === void 0 ? void 0 : options.maxRetries) || 5)) && this.state === 'connecting';
                this.log(`connect attempt ${tries} failed: ${error}${willReconnect ? ', retrying...' : ''}`, Constants_1.MessageLogLevel.info);
                if (this.state !== 'close' && !willReconnect) {
                    this.closeInternal(loggedOut ? Constants_1.DisconnectReason.invalidSession : error.message);
                }
                if (!willReconnect)
                    throw error;
            }
            finally {
                this.lastConnectTime = new Date();
            }
        }
        this.emit('open');
        this.releasePendingRequests();
        this.startKeepAliveRequest();
        this.log('opened connection to WhatsApp Web', Constants_1.MessageLogLevel.info);
        this.conn.on('close', () => this.unexpectedDisconnect(Constants_1.DisconnectReason.close));
        return this;
    }
    /** Meat of the connect logic */
    async connectInternal(options, delayMs) {
        // actual connect
        const connect = () => {
            var _a;
            const timeoutMs = (options === null || options === void 0 ? void 0 : options.timeoutMs) || 60 * 1000;
            const { ws, cancel } = Utils.openWebSocketConnection(5000, false);
            let task = ws
                .then(conn => this.conn = conn)
                .then(() => this.conn.on('message', data => this.onMessageRecieved(data)))
                .then(() => (this.log(`connected to WhatsApp Web server, authenticating via ${reconnectID ? 'reconnect' : 'takeover'}`, Constants_1.MessageLogLevel.info)))
                .then(() => this.authenticate(reconnectID))
                .then(() => {
                this.conn
                    .removeAllListeners('error')
                    .removeAllListeners('close');
            });
            let cancelTask;
            if (typeof (options === null || options === void 0 ? void 0 : options.waitForChats) === 'undefined' ? true : options === null || options === void 0 ? void 0 : options.waitForChats) {
                const { waitForChats, cancelChats } = this.receiveChatsAndContacts(true);
                task = Promise.all([task, waitForChats]).then(() => { });
                cancelTask = () => { cancelChats(); cancel(); };
            }
            else
                cancelTask = cancel;
            // determine whether reconnect should be used or not
            const shouldUseReconnect = this.lastDisconnectReason !== Constants_1.DisconnectReason.replaced &&
                this.lastDisconnectReason !== Constants_1.DisconnectReason.unknown &&
                this.lastDisconnectReason !== Constants_1.DisconnectReason.intentional && ((_a = this.user) === null || _a === void 0 ? void 0 : _a.jid);
            const reconnectID = shouldUseReconnect ? this.user.jid.replace('@s.whatsapp.net', '@c.us') : null;
            const promise = Utils.promiseTimeout(timeoutMs, (resolve, reject) => (task.then(resolve).catch(reject)))
                .catch(err => {
                this.endConnection();
                throw err;
            });
            return { promise, cancel: cancelTask };
        };
        let promise = Promise.resolve();
        let cancellations = [];
        const cancel = () => cancellations.forEach(cancel => cancel());
        this.on('close', cancel);
        if (delayMs) {
            const { delay, cancel } = Utils.delayCancellable(delayMs);
            promise = delay;
            cancellations.push(cancel);
        }
        return promise
            .then(() => {
            const { promise, cancel } = connect();
            cancellations.push(cancel);
            return promise;
        })
            .finally(() => {
            cancel();
            this.off('close', cancel);
        });
    }
    /**
     * Sets up callbacks to receive chats, contacts & messages.
     * Must be called immediately after connect
     * @returns [chats, contacts]
     */
    receiveChatsAndContacts(stopAfterMostRecentMessage = false) {
        this.contacts = {};
        this.chats.clear();
        let receivedContacts = false;
        let receivedMessages = false;
        let resolveTask;
        const deregisterCallbacks = () => {
            // wait for actual messages to load, "last" is the most recent message, "before" contains prior messages
            this.deregisterCallback(['action', 'add:last']);
            if (!stopAfterMostRecentMessage) {
                this.deregisterCallback(['action', 'add:before']);
                this.deregisterCallback(['action', 'add:unread']);
            }
            this.deregisterCallback(['response', 'type:chat']);
            this.deregisterCallback(['response', 'type:contacts']);
        };
        const checkForResolution = () => {
            if (receivedContacts && receivedMessages)
                resolveTask();
        };
        // wait for messages to load
        const chatUpdate = json => {
            receivedMessages = true;
            const isLast = json[1].last || stopAfterMostRecentMessage;
            const messages = json[2];
            if (messages) {
                messages.reverse().forEach(([, , message]) => {
                    const jid = message.key.remoteJid;
                    const chat = this.chats.get(jid);
                    chat === null || chat === void 0 ? void 0 : chat.messages.unshift(message);
                });
            }
            // if received contacts before messages
            if (isLast && receivedContacts)
                checkForResolution();
        };
        // wait for actual messages to load, "last" is the most recent message, "before" contains prior messages
        this.registerCallback(['action', 'add:last'], chatUpdate);
        if (!stopAfterMostRecentMessage) {
            this.registerCallback(['action', 'add:before'], chatUpdate);
            this.registerCallback(['action', 'add:unread'], chatUpdate);
        }
        // get chats
        this.registerCallback(['response', 'type:chat'], json => {
            if (json[1].duplicate || !json[2])
                return;
            json[2]
                .forEach(([item, chat]) => {
                if (!chat) {
                    this.log(`unexpectedly got null chat: ${item}, ${chat}`, Constants_1.MessageLogLevel.info);
                    return;
                }
                chat.jid = Utils.whatsappID(chat.jid);
                chat.t = +chat.t;
                chat.count = +chat.count;
                chat.messages = [];
                const oldChat = this.chats.get(chat.jid);
                oldChat && this.chats.delete(oldChat);
                this.chats.insert(chat); // chats data (log json to see what it looks like)
            });
            this.log(`received ${json[2].length} chats`, Constants_1.MessageLogLevel.info);
            if (json[2].length === 0) {
                receivedMessages = true;
                checkForResolution();
            }
        });
        // get contacts
        this.registerCallback(['response', 'type:contacts'], json => {
            if (json[1].duplicate || !json[2])
                return;
            receivedContacts = true;
            json[2].forEach(([type, contact]) => {
                if (!contact)
                    return this.log(`unexpectedly got null contact: ${type}, ${contact}`, Constants_1.MessageLogLevel.info);
                contact.jid = Utils.whatsappID(contact.jid);
                this.contacts[contact.jid] = contact;
            });
            this.log(`received ${json[2].length} contacts`, Constants_1.MessageLogLevel.info);
            checkForResolution();
        });
        // wait for the chats & contacts to load
        let cancelChats;
        const waitForChats = new Promise((resolve, reject) => {
            resolveTask = resolve;
            cancelChats = () => reject(Constants_1.CancelledError());
        })
            .then(() => (this.chats
            .all()
            .forEach(chat => {
            const respectiveContact = this.contacts[chat.jid];
            chat.name = (respectiveContact === null || respectiveContact === void 0 ? void 0 : respectiveContact.name) || (respectiveContact === null || respectiveContact === void 0 ? void 0 : respectiveContact.notify) || chat.name;
        })))
            .finally(deregisterCallbacks);
        return { waitForChats, cancelChats };
    }
    releasePendingRequests() {
        this.pendingRequests.forEach(({ resolve }) => resolve()); // send off all pending request
        this.pendingRequests = [];
    }
    onMessageRecieved(message) {
        var _a, _b;
        if (message[0] === '!') {
            // when the first character in the message is an '!', the server is updating the last seen
            const timestamp = message.slice(1, message.length).toString('utf-8');
            this.lastSeen = new Date(parseInt(timestamp));
        }
        else {
            const decrypted = Utils.decryptWA(message, (_a = this.authInfo) === null || _a === void 0 ? void 0 : _a.macKey, (_b = this.authInfo) === null || _b === void 0 ? void 0 : _b.encKey, new Decoder_1.default());
            if (!decrypted)
                return;
            const [messageTag, json] = decrypted;
            if (this.logLevel === Constants_1.MessageLogLevel.all) {
                this.log(messageTag + ', ' + JSON.stringify(json), Constants_1.MessageLogLevel.all);
            }
            /*
             Check if this is a response to a message we sent
            */
            if (this.callbacks[messageTag]) {
                const q = this.callbacks[messageTag];
                q.callback(json);
                delete this.callbacks[messageTag];
                return;
            }
            /*
             Check if this is a response to a message we are expecting
            */
            if (this.callbacks['function:' + json[0]]) {
                const callbacks = this.callbacks['function:' + json[0]];
                let callbacks2;
                let callback;
                for (const key in json[1] || {}) {
                    callbacks2 = callbacks[key + ':' + json[1][key]];
                    if (callbacks2) {
                        break;
                    }
                }
                if (!callbacks2) {
                    for (const key in json[1] || {}) {
                        callbacks2 = callbacks[key];
                        if (callbacks2) {
                            break;
                        }
                    }
                }
                if (!callbacks2) {
                    callbacks2 = callbacks[''];
                }
                if (callbacks2) {
                    callback = callbacks2[json[2] && json[2][0][0]];
                    if (!callback) {
                        callback = callbacks2[''];
                    }
                }
                if (callback) {
                    callback(json);
                    return;
                }
            }
            if (this.logLevel === Constants_1.MessageLogLevel.unhandled) {
                this.log('[Unhandled] ' + messageTag + ', ' + JSON.stringify(json), Constants_1.MessageLogLevel.unhandled);
            }
        }
    }
    /** Send a keep alive request every X seconds, server updates & responds with last seen */
    startKeepAliveRequest() {
        this.keepAliveReq && clearInterval(this.keepAliveReq);
        this.keepAliveReq = setInterval(() => {
            if (!this.lastSeen)
                this.lastSeen = new Date();
            const diff = new Date().getTime() - this.lastSeen.getTime();
            /*
                check if it's been a suspicious amount of time since the server responded with our last seen
                it could be that the network is down
            */
            if (diff > Constants_1.KEEP_ALIVE_INTERVAL_MS + 5000)
                this.unexpectedDisconnect(Constants_1.DisconnectReason.lost);
            else if (this.conn)
                this.send('?,,'); // if its all good, send a keep alive request
            // poll phone connection as well, 
            // 5000 ms for timeout
            this.checkPhoneConnection(5000)
                .then(connected => {
                this.phoneConnected !== connected && this.emit('connection-phone-change', { connected });
                this.phoneConnected = connected;
            });
        }, Constants_1.KEEP_ALIVE_INTERVAL_MS);
    }
    /**
     * Check if your phone is connected
     * @param timeoutMs max time for the phone to respond
     */
    async checkPhoneConnection(timeoutMs = 5000) {
        if (this.state !== 'open')
            return false;
        try {
            const response = await this.query({ json: ['admin', 'test'], timeoutMs, waitForOpen: false });
            return response[1];
        }
        catch (error) {
            return false;
        }
    }
}
exports.WAConnection = WAConnection;
