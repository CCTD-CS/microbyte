import MBSpecs from "./MBSpecs";
import { MicrobitBluetoothDeviceServices } from "./MicrobitBluetoothDeviceServices";
import { MicrobitDevice, MicrobitDeviceState } from "./MicrobitDevice";
import { debugLog } from "../utils/Logging";
import { MicrobitHandler } from "../interfaces/MicrobitHandler";

export class MicrobitBluetoothDevice implements MicrobitDevice {

    private bluetoothDevice: BluetoothDevice | undefined = undefined;
    private state: MicrobitDeviceState = MicrobitDeviceState.CLOSED;
    private shouldReconnectAutomatically: boolean = false;
    private disconnectHandler: ((event: Event) => void) | undefined = undefined;
    private deviceServices: MicrobitBluetoothDeviceServices | undefined = undefined;
    private microbitHandler: MicrobitHandler | undefined = undefined;
    private microbitVersion: MBSpecs.MBVersion | undefined = undefined;
    private name: string | undefined = undefined;

    public constructor(bluetoothDevice?: BluetoothDevice) {
        if (bluetoothDevice) {
            this.bluetoothDevice = bluetoothDevice;
        }
    }

    public setLEDMatrix(matrix: boolean[][]): Promise<void> {
        if (this.deviceServices) {
            return this.deviceServices.setLEDMatrix(matrix);
        } else {
            throw new Error("Device services not initialized");
        }
    }

    public setHandler(handler: MicrobitHandler) {
        debugLog("Setting micro:bit handler", handler);
        this.microbitHandler = handler;
        if (this.deviceServices) {
            this.deviceServices.setAccelerometerHandler(handler.onAccelerometerDataReceived);
            this.deviceServices.setUartHandler(handler.onMessageReceived);
            this.deviceServices.setButtonAHandler(handler.onButtonAPressed);
            this.deviceServices.setButtonBHandler(handler.onButtonBPressed);
        }
    }

    public async sendMessage(message: string): Promise<void> {
        if (this.deviceServices) {
            await this.deviceServices.sendMessage(message);
        } else {
            console.warn("Cannot send message, there are no device services attached to the microbit bluetooth device")
        }
    }

    public close(): void {
        if (this.bluetoothDevice) {
            this.bluetoothDevice.gatt?.disconnect();
        }
        this.bluetoothDevice = undefined;
        this.setState(MicrobitDeviceState.CLOSED);
    }

    public async connect(name?: string): Promise<void> {
        debugLog("Connecting to micro:bit");
        if (!this.microbitHandler) {
            console.warn("micro:bit handler has not been set, some functionality may not work properly");
        }
        let timeout: NodeJS.Timeout | undefined = undefined;
        if (this.getState() !== MicrobitDeviceState.CLOSED) {
            timeout = setTimeout(() => {
                this.unsetBluetoothDevice(new Error("Connection failed, timeout reached"));
                throw new Error("Connection failed, timeout reached");
            }, 10000);
        }
        try {
            // We need to remember the device in case we need to shut it down gracefully
            const rememberedDevice = Object.assign({}, this.bluetoothDevice)
            await this.connectBluetoothDevice(name);
            this.assignDisconnectHandler();


            this.deviceServices = new MicrobitBluetoothDeviceServices(this.bluetoothDevice!);
            if (this.microbitHandler) {
                // Reassign the handler to ensure it works as before
                this.setHandler(this.microbitHandler);
            }
            this.setState(MicrobitDeviceState.INITIALIZING)
            await this.deviceServices.init();

            // Reveals if it's a version 1 or 2 micro:bit
            this.microbitVersion = await MBSpecs.Utility.getModelNumber(this.bluetoothDevice!.gatt!);

            debugLog("Micro:bit version", this.microbitVersion);

            // Due to for example timeout, the state might have changed.
            if (this.state === MicrobitDeviceState.CLOSED) {
                debugLog("Connection failed, state is closed");
                if (rememberedDevice) {
                    rememberedDevice.gatt?.disconnect(); // Shutdown the connection gracefully
                }
                return;
            }
            this.setState(MicrobitDeviceState.CONNECTED);
            debugLog("Connected to micro:bit");
        } catch (error: unknown) {
            debugLog("Error connecting to micro:bit", error);
            this.unsetBluetoothDevice(error);
        } finally {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    }

    private unsetBluetoothDevice(error: unknown) {
        if (this.microbitHandler) {
            this.state === MicrobitDeviceState.RECONNECTING && this.microbitHandler.onReconnectError(error as Error)
            this.state === MicrobitDeviceState.CONNECTING && this.microbitHandler.onConnectError(error as Error);
        }
        this.setState(MicrobitDeviceState.CLOSED);
        if (this.bluetoothDevice) {
            if (this.bluetoothDevice.gatt) {
                this.bluetoothDevice.gatt.disconnect();
            }
            this.bluetoothDevice = undefined;
        }

    }

    private async connectBluetoothDevice(name?: string) {
        if (!this.bluetoothDevice) {
            debugLog("Requesting micro:bit device");
            this.setState(MicrobitDeviceState.CONNECTING);
            this.bluetoothDevice = await this.requestDevice(name);
        } else {
            debugLog("Reconnecting to device");
            this.setState(MicrobitDeviceState.RECONNECTING);
        }

        if (this.bluetoothDevice.gatt) {
            await this.bluetoothDevice.gatt?.connect();
        }
    }

    private assignDisconnectHandler() {
        debugLog("Assigning disconnect handler");
        if (!this.bluetoothDevice) {
            debugLog("No bluetooth device to assign disconnect handler to");
            return;
        }
        // Removing and adding the event listener to avoid multiple listeners
        if (this.disconnectHandler) {
            this.bluetoothDevice!.removeEventListener('gattserverdisconnected', this.disconnectHandler);
        }
        this.disconnectHandler = async () => await this.handleDisconnectEvent();
        this.bluetoothDevice?.addEventListener('gattserverdisconnected', this.disconnectHandler);
    }


    private async handleDisconnectEvent() {
        debugLog("Disconnected from micro:bit");

        // Some cleanup
        this.disconnectedCleanup();


        if (this.shouldReconnectAutomatically) {
            this.setState(MicrobitDeviceState.DISCONNECTED);
            await this.attemptReconnect();
        } else {
            this.setState(MicrobitDeviceState.CLOSED);
        }
    }

    private async attemptReconnect() {
        debugLog("Attempting to reconnect to micro:bit");
        this.setState(MicrobitDeviceState.RECONNECTING);
        try {
            debugLog("Reconnecting to micro:bit");
            await this.connect();
        } catch (error) {
            debugLog("Error reconnecting to micro:bit", error);
        }
    }

    public getState(): MicrobitDeviceState {
        if (this.bluetoothDevice) {
            if (this.bluetoothDevice.gatt) {
                if (this.bluetoothDevice.gatt?.connected) {
                    debugLog("getState: CONNECTED")
                    return MicrobitDeviceState.CONNECTED;
                }
            } else {
                debugLog("getState: CLOSED")
                return MicrobitDeviceState.CLOSED;
            }
        }
        debugLog("getState: STATE->" + this.state)
        return this.state;
    }

    public setAutoReconnect(shouldReconnectAutomatically: boolean): void {
        this.shouldReconnectAutomatically = shouldReconnectAutomatically;
    }

    public isAutoReconnectEnabled(): boolean {
        return this.shouldReconnectAutomatically;
    }

    public disconnect(): void {
        this.setState(MicrobitDeviceState.CLOSED);
    }

    private disconnectedCleanup() {
        if (this.bluetoothDevice) {
            this.bluetoothDevice.gatt?.disconnect();
        }
    }

    private async setState(state: MicrobitDeviceState) {
        this.state = state;

        debugLog("Setting state to", state, "has handler", this.microbitHandler);
        if (this.microbitHandler) {
            switch (state) {
                case MicrobitDeviceState.CONNECTED:
                    if (!this.microbitVersion) {
                        this.microbitHandler.onConnectError(new Error("Could not determine micro:bit version"));
                    }
                    this.microbitHandler.onConnected(this.microbitVersion);
                    break;
                case MicrobitDeviceState.DISCONNECTED:
                    this.microbitHandler.onDisconnected();
                    break;
                case MicrobitDeviceState.CONNECTING:
                    this.microbitHandler.onConnecting();
                    break;
                case MicrobitDeviceState.RECONNECTING:
                    this.microbitHandler.onReconnecting();
                    break;
                case MicrobitDeviceState.CLOSED:
                    this.microbitHandler.onClosed();
                    break;
                case MicrobitDeviceState.INITIALIZING:
                    this.microbitHandler.onInitializing();
                    break;
            }
        }
    }

    private async requestDevice(name?: string) {
        this.name = name;
        const filters = name
            ? [{ namePrefix: `BBC micro:bit [${name}]` }]
            : [{ namePrefix: `BBC micro:bit` }];
        const device = await navigator.bluetooth.requestDevice({
            filters: filters,
            optionalServices: [
                MBSpecs.Services.UART_SERVICE,
                MBSpecs.Services.ACCEL_SERVICE,
                MBSpecs.Services.DEVICE_INFO_SERVICE,
                MBSpecs.Services.LED_SERVICE,
                MBSpecs.Services.IO_SERVICE,
                MBSpecs.Services.BUTTON_SERVICE,
            ],
        })

        return device;
    }

    public async setIOPin(pin: MBSpecs.UsableIOPin, on: boolean): Promise<void> {
        if (this.deviceServices) {
            await this.deviceServices.setIOPin(pin, on);
        } else {
            throw new Error("Device services not initialized");
        }
    }

    public getLastVersion(): MBSpecs.MBVersion | undefined {
        if (this.microbitVersion) {
            return this.microbitVersion;
        }
        return undefined;
    }

    public getLastName(): string | undefined {
        return this.name;
    }

    public getId(): string | undefined {
        return this.bluetoothDevice?.id;
    }
}