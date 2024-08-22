import MBSpecs from "../implementations/MBSpecs";

export interface MicrobitHandler {
    onConnected: (versionNumber: MBSpecs.MBVersion) => void;

    onAccelerometerDataReceived: (x: number, y: number, z: number) => void;

    onButtonAPressed: () => void;

    onButtonBPressed: () => void;

    onUartMessageReceived: (data: string) => void;
}