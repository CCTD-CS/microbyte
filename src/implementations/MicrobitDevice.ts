
/**
 * The state of the Microbit device
 */
export enum MicrobitDeviceState {
    /**
     * The device is connected
     */
    CONNECTED = "CONNECTED",
    /**
     * The device is disconnected
     */
    DISCONNECTED = "DISCONNECTED",
    /**
     * The device is connecting
     */
    CONNECTING = "CONNECTING",
    /**
     * The device is reconnecting
     */
    RECONNECTING = "RECONNECTING",
    /**
     * The device is closed
     */
    CLOSED = "CLOSED"
}

export interface MicrobitDevice {
    /**
     * Disconnect the device
     */
    disconnect(): void;

    /**
     * Connect the device
     */
    connect(): void;

    /**
     * Close the device
     */
    close(): void;

    /**
     * Get the state of the device
     */
    getState(): MicrobitDeviceState;

    /**
     * Set whether the device should reconnect automatically
     */
    setAutoReconnect(shouldReconnectAutomatically: boolean): void;

    /**
     * Get whether the device should reconnect automatically
     */
    isAutoReconnectEnabled(): boolean;
}