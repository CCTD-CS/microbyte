import { PairingPattern } from "../utils/PairingPattern";
import { IsService } from "./ServiceInterface";

export interface isMicrobit {
	getService<T extends IsService>(): T;

	request(name?: string | PairingPattern): Promise<void>;

	getBluetoothDevice(): BluetoothDevice | undefined;
}
