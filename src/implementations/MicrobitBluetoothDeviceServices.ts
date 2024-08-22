import MBSpecs from "./MBSpecs";
import { debugLog } from "../utils/Logging";

export class MicrobitBluetoothDeviceServices {

    private accelerometerListener: ((event: Event) => void) | undefined = undefined;
    private buttonAListener: ((event: Event) => void) | undefined = undefined;
    private buttonBListener: ((event: Event) => void) | undefined = undefined;
    private uartTxListener: ((event: Event) => void) | undefined = undefined;
    private uartRxCharacteristic: BluetoothRemoteGATTCharacteristic | undefined = undefined;

    /*     private accelerometerHandler: ((x: number, y: number, z: number) => void) | undefined = undefined;
        private buttonAHandler: (() => void) | undefined = undefined;
        private buttonBHandler: (() => void) | undefined = undefined;
        private uartHandler: ((data: string) => void) | undefined = undefined; */

    constructor(private bluetoothDevice: BluetoothDevice) {
        if (!bluetoothDevice) {
            throw new Error("Bluetooth device is required");
        }
    }

    public async init() {
        if (!this.bluetoothDevice.gatt) {
            throw new Error("No GATT server found, this is a critical error, please report it");
        }
        try {
            this.initAccelerometer(this.bluetoothDevice.gatt);
            this.initButtons(this.bluetoothDevice.gatt);
            this.initUart(this.bluetoothDevice.gatt);
        } catch (error) {
            console.error(error);
        }
    }
    /* 
        public setAccelerometerHandler(handler: (x: number, y: number, z: number) => void) {
            this.accelerometerHandler = handler;
        }
    
        public setButtonAHandler(handler: () => void) {
            this.buttonAHandler = handler;
        }
    
        public setButtonBHandler(handler: () => void) {
            this.buttonBHandler = handler;
        }
    
        public setUartHandler(handler: (data: string) => void) {
            this.uartHandler = handler;
        } */

    private async initAccelerometer(gatt: BluetoothRemoteGATTServer) {
        const accelService = await gatt.getPrimaryService(MBSpecs.Services.ACCEL_SERVICE);
        const accelCharacteristic = await accelService.getCharacteristic(MBSpecs.Characteristics.ACCEL_DATA);
        await accelCharacteristic.startNotifications();


        if (this.accelerometerListener) {
            accelCharacteristic.removeEventListener('characteristicvaluechanged', this.accelerometerListener);
        }
        this.accelerometerListener = _e => { }/* debugLog(e);  - spammy*/
        accelCharacteristic.addEventListener('characteristicvaluechanged', this.accelerometerListener);
    }

    private async initButtons(gatt: BluetoothRemoteGATTServer) {
        const buttonService = await gatt.getPrimaryService(MBSpecs.Services.BUTTON_SERVICE);
        const buttonACharacteristic = await buttonService.getCharacteristic(MBSpecs.Characteristics.BUTTON_A);
        const buttonBCharacteristic = await buttonService.getCharacteristic(MBSpecs.Characteristics.BUTTON_B);

        await buttonACharacteristic.startNotifications();
        await buttonBCharacteristic.startNotifications();

        if (this.buttonAListener) {
            buttonACharacteristic.removeEventListener('characteristicvaluechanged', this.buttonAListener);
        }
        this.buttonAListener = e => debugLog(e);
        buttonACharacteristic.addEventListener('characteristicvaluechanged', this.buttonAListener);

        if (this.buttonBListener) {
            buttonBCharacteristic.removeEventListener('characteristicvaluechanged', this.buttonBListener);
        }
        this.buttonBListener = e => debugLog(e);
        buttonBCharacteristic.addEventListener('characteristicvaluechanged', this.buttonBListener);
    }

    private async initUart(gatt: BluetoothRemoteGATTServer) {
        // TX is the data that the micro:bit sends to the client
        const uartService = await gatt.getPrimaryService(MBSpecs.Services.UART_SERVICE);
        const txCharacteristic = await uartService.getCharacteristic(MBSpecs.Characteristics.UART_DATA_TX);
        await txCharacteristic.startNotifications();

        if (this.uartTxListener) {
            txCharacteristic.removeEventListener('characteristicvaluechanged', this.uartTxListener);
        }
        this.uartTxListener = e => debugLog(e);
        txCharacteristic.addEventListener('characteristicvaluechanged', this.uartTxListener);

        // RX is the data that the client sends to the micro:bit
        this.uartRxCharacteristic = await uartService.getCharacteristic(MBSpecs.Characteristics.UART_DATA_RX);
    }

    public async sendMessage(message: string) {
        const dataView = MBSpecs.Utility.messageToDataview(message);
        try {
            if (!this.uartRxCharacteristic) {
                throw new Error("UART RX characteristic not initialized");
            }

            await this.uartRxCharacteristic!.writeValue(dataView);
        } catch (error) {
            console.error(error);
        }
    }

}