![Logo](/assets/logo.png)

Utility tool that aids in communication and connection of micro:bits. 

```bash
npm install microbyte
```

# Features
- ✅ - Fully supported
- 🔨 In progress / partially supported
- ❌ Not supported

### Protocols

| Protocol   | Support |
| ---------- | ------- |
| Bluetooth  | 🔨      |
| Radio      | ❌      |
| USB        | 🔨      |

### Bluetooth

| Service       | Support                                   |
| ------------- | ----------------------------------------- |
| Connection    | ✅                                        |
| Reconnection  | 🔨 Doesn't retry if failed                |
| Accelerometer | ✅                                        |
| UART - Read   | ✅                                        |
| UART - Write  | ✅                                        |
| Buttons       | 🔨 A and B, but not both simultanously    |
| LEDs          | 🔨 On/Off. No variable strength           |
| PIN IO        | 🔨 Pins 1,2,3 are addressable             |
| Speaker*      | ❌                                        |

\*Not applicable to v1 micro:bits

### Radio
Not implemented yet

### USB

| Feature           | Support                                   |
| ----------------- | ----------------------------------------- |
| Connection        | ✅                                        |
| Read Serial number| ✅                                        |
| Read version      | ✅                                        |
| Flash .hex file   | ✅                                        |
| Friendly name     | ✅                                        |
| Serial data       | ❌                                        |


# Usage

### Bluetooth
This is how you would use the BLE receiver for interacting with the micro:bit
```ts
import { MicrobitBluetoothDevice, Microbit } from "microbyte";

const microbit = new Microbit();
const microbitBluetooth = new MicrobitBluetoothDevice();
microbit.setDevice(microbitBluetooth);

// Must be performed as a result of a user input
const connectToDevice = () => {
    microbit.connect();
}
```

For security reasons, chrome won't allow you to connect the micro:bit unless it's a result of a user action.

```html
<button onClick={connectToDevice}>
    Connect to the microbit
</button>
```

Once connected, it will attempt to stay connected, if the auto-reconnect feature is enabled

```ts
// Attempt to reconnect if disconnected
microbit.setAutoReconnect(true); 
```

Now in order to get feedback, we must assign a handler.

Microbyte has the interface `MicrobitHandler`, which is used by the microbit to deliver data such as Accelerometer values

We should implement this interface and assign it to the micro:bit, here's an example.

```ts
class MyHandler implements MicrobitHandler {
    public onConnected: (versionNumber?: MBSpecs.MBVersion) => {
        console.log(`A microbit v${versionNumber} has connected`);
    } 

    public onAccelerometerDataReceived: (x: number, y: number, z: number) => {
        console.log(`Accelerometer reads (${x}, ${y}, ${z})`);
    };

    public onButtonAPressed: (state: MBSpecs.ButtonState) => {
        console.log(`Button A changed state to ${state}`);
    };

    public onButtonBPressed: (state: MBSpecs.ButtonState) => {
        console.log(`Button B changed state to ${state}`);
    };

    public onUartMessageReceived: (data: string) => {
        console.log(`Received UART message: ${data}`);
    };

    public onDisconnected: () => {
        console.log('micro:bit was disconnected');
    };

    public onReconnecting: () => {
        console.log('Attempting to reconnect micro:bit');
    };

    public onReconnected: () => {
        console.log('micro:bit was reconnected');
    };

    public onConnectError: (error: Error) => {
        console.log('Microbit failed to connect', error);
    };

    public onReconnectError: (error: Error) => {
        console.log('Microbit failed to reconnect', error);
    };

    public onClosed: () => {
        console.log('Goodbye!');
    };

    public onConnecting: () => {
        console.log("Attempting to connect micro:bit");
    };

    public onClosedError: (error: Error) => {
        console.log("micro:bit failed to close gracefully");
    };
}
```

Implementing the interface allows us to use it by assigning the handler to the micro:bit.
```ts
import { MicrobitBluetoothDevice, Microbit } from "microbyte";

const microbit = new Microbit();
const microbitBluetooth = new MicrobitBluetoothDevice();
microbit.setDevice(microbitBluetooth);

// Create and set the handler
const handler = new MyHandler();
microbit.setHandler(handler)
```


### USB

Using the USB features is done via the USB controller.

```ts
import { MicrobitBluetoothDevice, Microbit } from "microbyte";

const microbit = new Microbit();
const usbController: USBController = microbit.getUsbController();

const connectToMicrobitUsb = async () => {
    await usbController.connect();
    const mbName = await usbController.getFriendlyName();
    console.log(`micro:bit name is: ${name}`);
};
```

Connections must be done as a result of user interaction, just like the bluetooth device.

```html
<button on:click={connectToMicrobitUsb}>Connect USB</button>
```

Using the micro:bit USBController, you can read the model number and flash .hex files.

```ts
import { MicrobitBluetoothDevice, Microbit } from "microbyte";

const microbit = new Microbit();
const usbController: USBController = microbit.getUsbController();

const flashHex = async () => {
    let hex = "v1.hex";
    // We use different hex files depending on the micro:bit model
    if (usbController.getModelNumber() === 2) {
        hex = "v2.hex"; // Can be any URL. These files are located on /v2.hex
    }

    // Use fetch to retrieve the data from a URL and convert it to an ArrayBuffer
    const hexFile: Response = await fetch(hex);
    const buffer: ArrayBuffer = await hexFile.arrayBuffer();
    usbController.flashHex(buffer, (prog) => {
        console.log(`Flashing progress: ${prog * 100}%`)
    });
};
```

Then we can flash hex files by clicking a single button.

```html
<button on:click={flashHex}>Flash hex file</button>
```


# Examples
Examples can be found in `/examples/`


# For devs

### ```npm run dev```
Continously compile project during development

### ```npm build```
Builds the project

### ```npm run docs```
Produces documentation (Not used at the moment)

# Notice
This project is developed in collaboration with Aarhus University in Denmark for the ML-Machine project.

License: MIT
