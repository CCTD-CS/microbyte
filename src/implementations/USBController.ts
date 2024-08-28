import { CortexM, WebUSB } from "dapjs";
import { debugLog } from "../utils/Logging";
import MBSpecs from "./MBSpecs";

class USBController {

    private webUsb: WebUSB | undefined = undefined;
    private device: USBDevice | undefined = undefined;

    public async connect() {
        debugLog("USBController connecting via USB");
        const requestOptions: USBDeviceRequestOptions = {
            filters: [
                {
                    vendorId: MBSpecs.USBSpecs.VENDOR_ID,
                    productId: MBSpecs.USBSpecs.PRODUCT_ID,
                },
            ],
        };

        try {
            const device: USBDevice = await navigator.usb.requestDevice(requestOptions);
            this.device = device;
            this.webUsb = new WebUSB(device);
        } catch (e) {
            console.log(e);
            return Promise.reject(e);
        }
    }

    public getSerialNumber(): string | undefined {
        if (this.device) {
            return this.device.serialNumber;
        }
        return "";
    }

    public async getFriendlyName(): Promise<string> {
        let result = '';
        let cortex = undefined;
        try {
            if (!this.webUsb) {
                return Promise.reject("WebUSB not available, make sure to connect it first");
            }
            cortex = new CortexM(this.webUsb);
            await cortex.connect();
            // Microbit only uses MSB of serial number
            const serial = await cortex.readMem32(
                MBSpecs.USBSpecs.FICR + MBSpecs.USBSpecs.DEVICE_ID_1,
            );
            result = MBSpecs.Utility.serialNumberToName(serial);
            return Promise.resolve(result);
        } catch (e: unknown) {
            return Promise.reject(e);
        } finally {
            if (cortex) {
                cortex.disconnect();
            }
        }
    }

}

export default USBController;