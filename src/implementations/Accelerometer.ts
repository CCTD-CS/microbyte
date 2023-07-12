import { AbstractService } from "./AbstractService";

export class Accelerometer extends AbstractService {
	private readonly uuid = "e95d0753-251d-470a-a062-fa1922dfa9a8";

	public getServiceUUID(): string {
		return this.uuid;
	}

	public listenForChange(
		callback: (x: number, y: number, z: number) => void
	) {
		if (this.getMicrobit().isBluetoothConnected()) {
			throw new Error(
				"Cannot listen for changes on accelerometer, it is not connected to bluetooth"
			);
		}
	}
}
