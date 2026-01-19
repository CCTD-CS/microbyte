import { MicrobitHandler } from "../interfaces/MicrobitHandler";
import MBSpecs from "./MBSpecs";

/**
 * The state of the Microbit device
 */
export enum MicrobitDeviceState {
    /**
     * The device is fully connected
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
     * The device has been connected, and is being initialized
     */
    INITIALIZING = "INITIALIZING",
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

    /**
     * Set the handler for the device. Handler is the object that will receive the data from the device
     * Also receives events such as connection and disconnection
     */
    setHandler(handler: MicrobitHandler): void;

    /**
     * Send a message to the device
     */
    sendMessage(message: string): Promise<void>;

    /**
     * Set the LED matrix on the device. It is a 5x5 matrix of booleans
     */
    setLEDMatrix(matrix: boolean[][]): Promise<void>;

    /**
     * Set the IO pin on the device
     */
    setIOPin(pin: number, on: boolean): Promise<void>;

    /**
     * Returns the version of the last connected micro:bit bluetooth device
     */
    getLastVersion(): MBSpecs.MBVersion | undefined;

    /**
     * Get last name of the connected micro:bit bluetooth device
     */
    getLastName(): string | undefined;

    /**
     * An identifier for the microbit device
     */
    getId(): string | undefined
}