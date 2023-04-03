import { PairingPattern } from "../utils/PairingPattern";
import { isMicrobit } from "../interfaces/MicrobitInterface";
import { IsService } from "../interfaces/ServiceInterface";
import { throwErrorIfBluetoothNotSupported } from "../utils/PlatformSupport";

export class Microbit implements isMicrobit {
	private services: IsService[];

	private bluetoothDevice: BluetoothDevice | undefined;

	public constructor(services: Array<new () => IsService> = []) {
		this.services = services.map((service) => new service());
	}

	public getBluetoothDevice(): BluetoothDevice | undefined {
		this.warnIfMicrobitIsNotDefined();
		return this.bluetoothDevice;
	}

	public async request(
		name?: string | PairingPattern,
		onSuccess?: () => void,
		onFailure?: (reason?: any) => void
	): Promise<void> {
		throwErrorIfBluetoothNotSupported();

		const optionalServicesUuids = this.getOptionalServiceUuids();

		const namePrefix = name ? `BBC micro:bit [${name}]` : `BBC micro:bit`;

		this.requestDevice(namePrefix, optionalServicesUuids)
			.then((device) =>
				this.handleDeviceRequestSuccess(device, onSuccess)
			)
			.catch(onFailure);
	}

	public getService<T extends IsService>(): T {
		throw new Error("Method not implemented.");
	}

	private async requestDevice(
		namePrefix: string,
		optionalServicesUuids: string[]
	) {
		return await navigator.bluetooth.requestDevice({
			filters: [{ namePrefix: namePrefix }],
			optionalServices: optionalServicesUuids,
		});
	}

	private handleDeviceRequestSuccess(
		device: BluetoothDevice,
		onSuccess: (() => void) | undefined
	) {
		this.bluetoothDevice = device;
		if (onSuccess) {
			onSuccess();
		}
	}

	private hasMicrobitBeenRequested(): boolean {
		if (!this.bluetoothDevice) {
			return false;
		}
		return true;
	}

	private getOptionalServiceUuids(): string[] {
		return this.services.map((service) => service.getServiceUUID());
	}

	private warnIfMicrobitIsNotDefined() {
		if (!this.hasMicrobitBeenRequested()) {
			console.warn(
				"Cannot get BluetoothDevice. It is undefined. Make sure to request it using microbit.request() function"
			);
		}
	}
}
