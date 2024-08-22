import MBSpecs from "./MBSpecs";
import { MicrobitBluetoothDeviceServices } from "./MicrobitBluetoothDeviceServices";
import { MicrobitDevice, MicrobitDeviceState } from "./MicrobitDevice";
import { debugLog } from "../utils/Logging";

export class MicrobitBluetoothDevice implements MicrobitDevice {

    private bluetoothDevice: BluetoothDevice | undefined = undefined;
    private state: MicrobitDeviceState = MicrobitDeviceState.CLOSED;
    private shouldReconnectAutomatically: boolean = false;
    private disconnectHandler: ((event: Event) => void) | undefined = undefined;
    private deviceServices: MicrobitBluetoothDeviceServices | undefined = undefined;

    public constructor() {
    }

    public close(): void {
        if (this.bluetoothDevice) {
            this.bluetoothDevice.gatt?.disconnect();
        }
        this.bluetoothDevice = undefined;
        this.state = MicrobitDeviceState.CLOSED;
    }

    public async connect() {
        debugLog("Connecting to micro:bit");
        try {
            if (!this.bluetoothDevice) {
                debugLog("Requesting micro:bit device");
                this.state = MicrobitDeviceState.CONNECTING;
                this.bluetoothDevice = await this.requestDevice();
            } else {
                this.state = MicrobitDeviceState.RECONNECTING;
            }

            await this.bluetoothDevice.gatt?.connect();
            if (!this.bluetoothDevice.gatt) {
                throw new Error("No GATT server found, this is a critical error, please report it");
            }


            // Removing and adding the event listener to avoid multiple listeners
            if (this.disconnectHandler) {
                this.bluetoothDevice.removeEventListener('gattserverdisconnected', this.disconnectHandler);
            }
            this.disconnectHandler = async () => await this.handleDisconnectEvent();
            this.bluetoothDevice.addEventListener('gattserverdisconnected', this.disconnectHandler);

            this.deviceServices = new MicrobitBluetoothDeviceServices(this.bluetoothDevice);
            this.deviceServices.init();

            // Reveals if it's a version 1 or 2 micro:bit
            await MBSpecs.Utility.getModelNumber(this.bluetoothDevice.gatt!);

            this.state = MicrobitDeviceState.CONNECTED;
            debugLog("Connected to micro:bit");
        } catch (error) {
            console.error(error);
            this.state = MicrobitDeviceState.DISCONNECTED;
            return
        }
    }

    private async handleDisconnectEvent() {
        debugLog("Disconnected from micro:bit");

        // Some cleanup
        this.disconnect();

        this.state = MicrobitDeviceState.DISCONNECTED;

        if (this.shouldReconnectAutomatically) {
            this.state = MicrobitDeviceState.RECONNECTING;
            try {
                debugLog("Reconnecting to micro:bit");
                await this.connect();
            } catch (error) {
                console.error(error);
            }
        }
    }

    public getState(): MicrobitDeviceState {
        if (this.bluetoothDevice) {
            if (this.bluetoothDevice.gatt?.connected) {
                return MicrobitDeviceState.CONNECTED;
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
        this.state = MicrobitDeviceState.DISCONNECTED;
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