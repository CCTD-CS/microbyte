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

| Service    | Support |
| ---------- | ------- |
| Accelerometer  | ✅      |
| UART - Read      | ✅      |
| UART - Write        | 🔨 Limited to 20 chars length      |
| Buttons      | 🔨 A and B, but not both simultaniously      |
| LEDs        | ❌      |
| PIN IO        | ❌      |
| Microphone*        | ❌      |

\*Not applicable to v1 micro:bits

### Radio
Not implemented yet

### USB
Not implemented yet


# Commands

## ```npm run dev```
Continously compile project during development

## ```npm build```
Builds the project

## ```npm run docs```
Produces documentation

