import { CortexM, DAPLink, WebUSB } from "dapjs";
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
        return this.device?.serialNumber
    }

    public getModelNumber(): MBSpecs.MBVersion {
        const serialNumber = this.getSerialNumber();
        if (!serialNumber) {
            throw new Error("Cannot get model number. Cannot read serialnumber!");
        }
        const sernoPrefix: string = serialNumber.substring(0, 4);
        if (parseInt(sernoPrefix) < 9903) return 1;
        else return 2;
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

    public async flashHex(
        hex: ArrayBuffer,
        progressCallback: (progress: number) => void,
      ): Promise<void> {    
        if (!this.webUsb) {
            throw new Error("Cannot flash hex, no device connected. Connect it first")
        }
        const target = new DAPLink(this.webUsb);
    
        target.on(DAPLink.EVENT_PROGRESS, (progress: number) => {
          progressCallback(progress);
        });
    
        try {
          await target.connect();
          await target.flash(hex);
          await target.disconnect();
        } catch (error) {
          console.log(error);
          return Promise.reject(error);
        }
        return Promise.resolve();
      }
}

export default USBController;