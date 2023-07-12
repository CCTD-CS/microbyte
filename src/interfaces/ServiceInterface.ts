import { Microbit } from "../microbyte";

export interface IsService {
	getServiceUUID(): string;

	getMicrobit(): Microbit;
}
