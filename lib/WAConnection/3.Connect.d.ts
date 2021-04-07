import { WAConnectOptions } from './Constants';
import { WAConnection as Base } from './1.Validation';
export declare class WAConnection extends Base {
    /** Connect to WhatsApp Web */
    connect(): Promise<this>;
    /** Meat of the connect logic */
    protected connectInternal(options: WAConnectOptions, delayMs?: number): Promise<void>;
    /**
     * Sets up callbacks to receive chats, contacts & messages.
     * Must be called immediately after connect
     * @returns [chats, contacts]
     */
    protected receiveChatsAndContacts(stopAfterMostRecentMessage?: boolean): {
        waitForChats: Promise<void>;
        cancelChats: () => void;
    };
    private releasePendingRequests;
    private onMessageRecieved;
    /** Send a keep alive request every X seconds, server updates & responds with last seen */
    private startKeepAliveRequest;
    /**
     * Check if your phone is connected
     * @param timeoutMs max time for the phone to respond
     */
    checkPhoneConnection(timeoutMs?: number): Promise<boolean>;
}
