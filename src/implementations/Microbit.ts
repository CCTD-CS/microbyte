import { MicrobitDevice, MicrobitDeviceState } from "./MicrobitDevice";

export class Microbit {

	private device: MicrobitDevice | undefined = undefined;

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
}