import { PairingPattern } from "../utils/PairingPattern";
import { isMicrobit } from "../interfaces/MicrobitInterface";
import { IsService } from "../interfaces/ServiceInterface";
import { throwErrorIfBluetoothNotSupported } from "../utils/PlatformSupport";

export class Microbit implements isMicrobit {
	private services: IsService[];
	private bluetoothDevice: BluetoothDevice | undefined;

	public constructor(
		services: Array<new (microbit: Microbit) => IsService> = []
	) {
		this.services = services.map((service) => new service(this));
	}

	public getService<T extends IsService>(
		serviceType: new (microbit: Microbit) => T
	): T {
		this.services.forEach((service: IsService) => {
			console.log(service.getServiceUUID())
			console.log(new serviceType(this).getServiceUUID())
			console.log(service.getServiceUUID() ===
				new serviceType(this).getServiceUUID());
			if (
				service.getServiceUUID() ===
				new serviceType(this).getServiceUUID()
			) {
				console.log("Service found")
				return service;
			}
		});
		console.log("Service not found")
		throw new Error(
			"Service not found, make sure to specify it in constructor."
		);
	}

	public async connect(): Promise<void> {
		this.warnIfMicrobitIsNotDefined();
		if (!this.bluetoothDevice) {
			throw new Error("BluetoothDevice is not defined.");
		}
		if (!this.bluetoothDevice.gatt) {
			throw new Error("BluetoothDevice.gatt is not defined.");
		}
		await this.bluetoothDevice.gatt.connect();
	}

	public isBluetoothConnected(): boolean {
		if (!this.bluetoothDevice) {
			console.log("no device");
			return false;
		}
		if (!this.bluetoothDevice.gatt) {
			console.log("no gatt");
			return false;
		}
		console.log(this.bluetoothDevice.gatt.connected);
		return this.bluetoothDevice.gatt.connected;
	}

	public getBluetoothDevice(): BluetoothDevice | undefined {
		this.warnIfMicrobitIsNotDefined();
		return this.bluetoothDevice;
	}

	public async requestBluetooth(
		name?: string | PairingPattern,
		onSuccess?: () => void,
		onFailure?: (reason?: any) => void
	): Promise<void> {
		throwErrorIfBluetoothNotSupported();

		const optionalServicesUuids = this.getOptionalServiceUuids();

		const namePrefix = name ? `BBC micro:bit [${name}]` : `BBC micro:bit`;

		await this.requestDevice(namePrefix, optionalServicesUuids)
			.then((device) =>
				this.handleDeviceRequestSuccess(device, onSuccess)
			)
			.catch(onFailure);
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
				"Cannot get BluetoothDevice. It is undefined. Make sure to request it using microbit.requestBluetooth() function"
			);
		}
	}
}
