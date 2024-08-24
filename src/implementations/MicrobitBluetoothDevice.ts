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
        debugLog("Setting micro:bit handler");
        this.microbitHandler = handler;
        if (this.deviceServices) {
            this.deviceServices.setAccelerometerHandler(handler.onAccelerometerDataReceived);
            this.deviceServices.setUartHandler(handler.onUartMessageReceived);
            this.deviceServices.setButtonAHandler(handler.onButtonAPressed);
            this.deviceServices.setButtonBHandler(handler.onButtonBPressed);
        }
    }

    public sendMessage(message: string): void {
        if (this.deviceServices) {
            this.deviceServices.sendMessage(message);
        }
    }

    public close(): void {
        if (this.bluetoothDevice) {
            this.bluetoothDevice.gatt?.disconnect();
        }
        this.bluetoothDevice = undefined;
        this.setState(MicrobitDeviceState.CLOSED);
    }

    public async connect(): Promise<void> {
        debugLog("Connecting to micro:bit");
        let timeout;
        if (this.getState() !== MicrobitDeviceState.CLOSED) {
            timeout = setTimeout(() => {
                this.unsetBluetoothDevice(Error("Connection failed, timeout reached"));
                throw new Error("Connection failed, timeout reached");
            }, 8000);
        }
        try {
            // We need to remember the device in case we need to shut it down gracefully
            const rememberedDevice = Object.assign({}, this.bluetoothDevice)
            await this.connectBluetoothDevice();
            this.assignDisconnectHandler();

            this.deviceServices = new MicrobitBluetoothDeviceServices(this.bluetoothDevice!);
            if (this.microbitHandler) {
                // Reassign the handler to ensure it works as before
                this.setHandler(this.microbitHandler);
            }
            await this.deviceServices.init();

            // Reveals if it's a version 1 or 2 micro:bit
            this.microbitVersion = await MBSpecs.Utility.getModelNumber(this.bluetoothDevice!.gatt!);

            // Due to for example timeout, the state might have changed.
            if (this.state === MicrobitDeviceState.CLOSED) {
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
            clearTimeout(timeout);
        }
    }

    private unsetBluetoothDevice(error?: unknown) {
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

    private async connectBluetoothDevice() {
        if (!this.bluetoothDevice) {
            debugLog("Requesting micro:bit device");
            this.setState(MicrobitDeviceState.CONNECTING);
            this.bluetoothDevice = await this.requestDevice();
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
        this.disconnect();

        this.setState(MicrobitDeviceState.DISCONNECTED);

        if (this.shouldReconnectAutomatically) {
            await this.attemptReconnect();
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
                    return MicrobitDeviceState.CONNECTED;
                }
            } else {
                return MicrobitDeviceState.CLOSED;
            }
        }
        return this.state;
    }

    public setAutoReconnect(shouldReconnectAutomatically: boolean): void {
        this.shouldReconnectAutomatically = shouldReconnectAutomatically;
    }

    public isAutoReconnectEnabled(): boolean {
        return this.shouldReconnectAutomatically;
    }

    public disconnect(): void {
        if (this.bluetoothDevice) {
            this.bluetoothDevice.gatt?.disconnect();
        }
        this.setState(MicrobitDeviceState.DISCONNECTED);
    }

    private async setState(state: MicrobitDeviceState) {
        this.state = state;
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
            }
        }
    }

    private async requestDevice(name?: string) {
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
}