import { IsService } from "../interfaces/ServiceInterface";

export class Accelerometer implements IsService {
	private readonly uuid = "e95d0753-251d-470a-a062-fa1922dfa9a8";

	public getServiceUUID(): string {
		return this.uuid;
	}
}
