import MBSpecs from "../implementations/MBSpecs";

export interface MicrobitHandler {
    onConnected: (versionNumber?: MBSpecs.MBVersion) => void;

    onAccelerometerDataReceived: (x: number, y: number, z: number) => void;

    onButtonAPressed: (state: MBSpecs.ButtonState) => void;

    onButtonBPressed: (state: MBSpecs.ButtonState) => void;

    onUartMessageReceived: (data: string) => void;

    onDisconnected: () => void;

    onReconnecting: () => void;

    onReconnected: () => void;

    onConnectError: (error: Error) => void;

    onReconnectError: (error: Error) => void;

    onClosed: () => void;

    onConnecting: () => void;

    onClosedError: (error: Error) => void;
}