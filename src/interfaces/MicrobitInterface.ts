import { PairingPattern } from "../utils/PairingPattern";
import { IsService } from "./ServiceInterface";

export interface isMicrobit {
	getService<T extends IsService>(serviceType: { new (): T }): T;

	requestBluetooth(name?: string | PairingPattern): Promise<void>;

	getBluetoothDevice(): BluetoothDevice | undefined;
}
