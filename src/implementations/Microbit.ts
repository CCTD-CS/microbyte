import { MicrobitHandler } from "../interfaces/MicrobitHandler";
import MBSpecs from "./MBSpecs";
import { MicrobitDevice, MicrobitDeviceState } from "./MicrobitDevice";
import USBController from "./USBController";

export class Microbit {

	private device: MicrobitDevice | undefined = undefined;
	private handler: MicrobitHandler | undefined = undefined;
	private usbController: USBController | undefined = undefined;

	constructor() {
	}

	public setDevice(device: MicrobitDevice) {
		this.device = device;
	}

	public connect() {
		if (!this.device) {
			throw new Error("Device not set");
		}
		if ([MicrobitDeviceState.DISCONNECTED, MicrobitDeviceState.CLOSED].includes(this.device.getState())) {
			this.device.connect();
		}
	}

	public setHandler(handler: MicrobitHandler) {
		this.handler = handler;
		if (this.device) {
			this.device.setHandler(this.handler);
		}
	}

	public sendMessage(message: string) {
		if (this.device) {
			this.device.sendMessage(message);
		}
	}

	public disconnect() {
		if (this.device) {
			this.device.setAutoReconnect(false);
			this.device.disconnect();
		}
	}

	public setAutoReconnect(shouldReconnectAutomatically: boolean): void {
		if (this.device) {
			this.device?.setAutoReconnect(shouldReconnectAutomatically);
		}
	}

	public isAutoReconnectEnabled(): boolean {
		return this.device?.isAutoReconnectEnabled() ?? false;
	}

	public getDeviceState(): MicrobitDeviceState {
		if (this.device) {
			return this.device.getState();
		}
		return MicrobitDeviceState.CLOSED;
	}

	public async setLEDMatrix(matrix: boolean[][]): Promise<void> {
		if (this.device) {
			await this.device.setLEDMatrix(matrix);
		}
	}

	public setIOPin(pin: MBSpecs.UsableIOPin, on: boolean) {
		if (this.device) {
			this.device.setIOPin(pin, on);
		}
	}

	public getUsbController() {
		if (!this.usbController) {
			this.usbController = new USBController();
		}
		return this.usbController;
	}

	public getLastVersion() {
		if (this.device) {
			return this.device.getLastVersion();
		}
		return undefined;
	}

	public getLastName() {
		if (this.device) {
			return this.device.getLastName();
		}
		return undefined;
	}
}