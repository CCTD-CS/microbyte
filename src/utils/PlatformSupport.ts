export const throwErrorIfBluetoothNotSupported = () => {
	if (!navigator.bluetooth) {
		throw new Error("Bluetooth is not supported on this browser");
	}
};

export const throwErrorIfUsbNotSupported = () => {
	if (!navigator.usb) {
		throw new Error("Bluetooth is not supported on this browser");
	}
};
