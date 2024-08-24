import MBSpecs from "./MBSpecs";
import { debugLog } from "../utils/Logging";


/**
 * UART data target. For fixing type compatibility issues.
 */
type CharacteristicDataTarget = EventTarget & {
    value: DataView;
};

export class MicrobitBluetoothDeviceServices {

    private accelerometerListener: ((event: Event) => void) | undefined = undefined;
    private buttonAListener: ((event: Event) => void) | undefined = undefined;
    private buttonBListener: ((event: Event) => void) | undefined = undefined;
    private uartTxListener: ((event: Event) => void) | undefined = undefined;
    private uartRxCharacteristic: BluetoothRemoteGATTCharacteristic | undefined = undefined;
    private LEDMatrixCharacteristic: BluetoothRemoteGATTCharacteristic | undefined = undefined;

    private accelerometerHandler: ((x: number, y: number, z: number) => void) | undefined = undefined;
    private buttonAHandler: ((state: MBSpecs.ButtonState) => void) | undefined = undefined;
    private buttonBHandler: ((state: MBSpecs.ButtonState) => void) | undefined = undefined;
    private uartHandler: ((data: string) => void) | undefined = undefined;

    constructor(private bluetoothDevice: BluetoothDevice) {
        if (!bluetoothDevice) {
            throw new Error("Bluetooth device is required");
        }
    }

    public async init() {
        debugLog("Initializing micro:bit services");
        if (!this.bluetoothDevice.gatt) {
            throw new Error("No GATT server found, this is a critical error, please report it");
        }
        await this.initAccelerometer(this.bluetoothDevice.gatt);
        await this.initButtons(this.bluetoothDevice.gatt);
        await this.initUart(this.bluetoothDevice.gatt);
        await this.initLED(this.bluetoothDevice.gatt);
        debugLog("Micro:bit services initialized");
    }

    public setAccelerometerHandler(handler: (x: number, y: number, z: number) => void) {
        this.accelerometerHandler = handler;
    }

    public setButtonAHandler(handler: (state: MBSpecs.ButtonState) => void) {
        this.buttonAHandler = handler;
    }

    public setButtonBHandler(handler: (state: MBSpecs.ButtonState) => void) {
        this.buttonBHandler = handler;
    }

    public setUartHandler(handler: (data: string) => void) {
        this.uartHandler = handler;
    }

    private async initAccelerometer(gatt: BluetoothRemoteGATTServer) {
        debugLog("Initializing accelerometer service");
        const accelService = await gatt.getPrimaryService(MBSpecs.Services.ACCEL_SERVICE);
        const accelCharacteristic = await accelService.getCharacteristic(MBSpecs.Characteristics.ACCEL_DATA);
        await accelCharacteristic.startNotifications();


        if (this.accelerometerListener) {
            accelCharacteristic.removeEventListener('characteristicvaluechanged', this.accelerometerListener);
        }
        this.accelerometerListener = (event: Event) => {
            const target: CharacteristicDataTarget = event.target as CharacteristicDataTarget;
            const x = target.value.getInt16(0, true);
            const y = target.value.getInt16(2, true);
            const z = target.value.getInt16(4, true);

            if (this.accelerometerHandler) {
                this.accelerometerHandler(x, y, z);
            }
        }
        accelCharacteristic.addEventListener('characteristicvaluechanged', this.accelerometerListener);
    }

    private async initButtons(gatt: BluetoothRemoteGATTServer) {
        debugLog("Initializing button service");
        const buttonService = await gatt.getPrimaryService(MBSpecs.Services.BUTTON_SERVICE);
        const buttonACharacteristic = await buttonService.getCharacteristic(MBSpecs.Characteristics.BUTTON_A);
        const buttonBCharacteristic = await buttonService.getCharacteristic(MBSpecs.Characteristics.BUTTON_B);

        await buttonACharacteristic.startNotifications();
        await buttonBCharacteristic.startNotifications();

        const buttonHandler = (event: Event, handler?: (state: MBSpecs.ButtonStates) => void) => {
            const target: CharacteristicDataTarget = event.target as CharacteristicDataTarget;
            const stateId = target.value.getUint8(0);
            let state: MBSpecs.ButtonState = MBSpecs.ButtonStates.Released;
            if (stateId === 1) {
                state = MBSpecs.ButtonStates.Pressed;
            }
            if (stateId === 2) {
                state = MBSpecs.ButtonStates.LongPressed;
            }
            if (handler) {
                handler(state);
            }
        }

        if (this.buttonAListener) {
            buttonACharacteristic.removeEventListener('characteristicvaluechanged', this.buttonAListener);
        }
        this.buttonAListener = e => buttonHandler(e, this.buttonAHandler)
        buttonACharacteristic.addEventListener('characteristicvaluechanged', this.buttonAListener);

        if (this.buttonBListener) {
            buttonBCharacteristic.removeEventListener('characteristicvaluechanged', this.buttonBListener);
        }
        this.buttonBListener = e => buttonHandler(e, this.buttonBHandler)
        buttonBCharacteristic.addEventListener('characteristicvaluechanged', this.buttonBListener);
    }

    private async initUart(gatt: BluetoothRemoteGATTServer) {
        debugLog("Initializing UART service");
        // TX is the data that the micro:bit sends to the client
        const uartService = await gatt.getPrimaryService(MBSpecs.Services.UART_SERVICE);
        const txCharacteristic = await uartService.getCharacteristic(MBSpecs.Characteristics.UART_DATA_TX);
        await txCharacteristic.startNotifications();

        if (this.uartTxListener) {
            txCharacteristic.removeEventListener('characteristicvaluechanged', this.uartTxListener);
        }
        this.uartTxListener = e => {
            // Convert the data to a string.
            const receivedData: number[] = [];
            const target: CharacteristicDataTarget = e.target as CharacteristicDataTarget;
            for (let i = 0; i < target.value.byteLength; i += 1) {
                receivedData[i] = target.value.getUint8(i);
            }
            const receivedString = String.fromCharCode.apply(null, receivedData);
            if (this.uartHandler) {
                this.uartHandler(receivedString);
            }
        };
        txCharacteristic.addEventListener('characteristicvaluechanged', this.uartTxListener);

        // RX is the data that the client sends to the micro:bit
        this.uartRxCharacteristic = await uartService.getCharacteristic(MBSpecs.Characteristics.UART_DATA_RX);
    }

    private async initLED(gatt: BluetoothRemoteGATTServer) {
        debugLog("Initializing LED service");
        const ledService = await gatt.getPrimaryService(MBSpecs.Services.LED_SERVICE);
        const ledCharacteristic = await ledService.getCharacteristic(MBSpecs.Characteristics.LED_MATRIX_STATE);
        this.LEDMatrixCharacteristic = ledCharacteristic;
    }

    public async sendMessage(message: string) {
        debugLog(`Sending message: ${message}`);
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

    public async setLEDMatrix(matrix: boolean[][]): Promise<void> {
        debugLog("Setting LED matrix");
        if (matrix.length !== 5 || matrix[0]!.length !== 5) {
            throw new Error('Matrix must be 5x5');
        }

        if (!this.LEDMatrixCharacteristic) {
            throw new Error('LED Matrix characteristic not initialized');
        }

        // To match overloads we must cast the matrix to a number[][]
        const numMatrix = matrix.map(row => row.map(value => (value ? 1 : 0)));

        // Create the dataview that will be sent through the bluetooth characteristic.
        const data = new Uint8Array(5);
        for (let i = 0; i < 5; i += 1) data[i] = MBSpecs.Utility.arrayToOctet(numMatrix[i]!);

        const dataView = new DataView(data.buffer);

        await this.LEDMatrixCharacteristic.writeValue(dataView);
    }

}