import { IsService } from "../interfaces/ServiceInterface";
import { Microbit } from "./Microbit";

export abstract class AbstractService implements IsService {
	abstract getServiceUUID(): string;

	constructor(private microbit: Microbit) {}

	getMicrobit(): Microbit {
		return this.microbit;
	}
}
