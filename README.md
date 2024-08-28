# microbyte
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
| USB        | ❌      |

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
| Microphone*   | ❌                                        |

\*Not applicable to v1 micro:bits

### Radio
Not implemented yet

### USB
Not implemented yet

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


# Examples
Examples can be found in `/examples/`


# For devs

## ```npm run dev```
Continously compile project during development

## ```npm build```
Builds the project

## ```npm run docs```
Produces documentation