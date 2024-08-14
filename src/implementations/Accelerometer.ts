import { AbstractService } from "./AbstractService";

export class Accelerometer extends AbstractService {
	private readonly uuid = "e95d0753-251d-470a-a062-fa1922dfa9a8";
	private readonly accelerometerDataUUID = "e95dca4b-251d-470a-a062-fa1922dfa9a8";

	public getServiceUUID(): string {
		return this.uuid;
	}

	public listenForChange(
		callback: (x: number, y: number, z: number) => void
	) {
		if (!this.getMicrobit().isBluetoothConnected()) {
			throw new Error(
				"Cannot listen for changes on accelerometer, it is not connected to bluetooth"
			);
		}
		this.getMicrobit().getBluetoothDevice()?.gatt?.getPrimaryService(this.uuid).then((service) => {
			service.getCharacteristic(this.accelerometerDataUUID).then((characteristic) => {
				characteristic.startNotifications().then(() => {
					characteristic.addEventListener('characteristicvaluechanged', (event) => {
						const value = (event.target as EventTarget & {
							value: DataView;
						}).value;
						const x = value.getInt16(0, true);
						const y = value.getInt16(2, true);
						const z = value.getInt16(4, true);
						callback(x, y, z);
					});
				});
			});
		});
	}
}
