<script lang="ts">
    import type { Microbit, USBController } from "microbyte";

    export let microbit: Microbit;

    const usbController: USBController = microbit.getUsbController();
    $: name = "";

    const connectToMicrobitUsb = async () => {
        await usbController.connect();
        name = await usbController.getFriendlyName();
    };

    $: progress = 0;
    const flashHex = async () => {
        let hex = "";
        // We use different hex files depending on the micro:bit model
        if (usbController.getModelNumber() === 2) {
            hex = "v2.hex";
        } else {
            hex = "v1.hex";
        }

        const hexFile: Response = await fetch(hex);
        const buffer: ArrayBuffer = await hexFile.arrayBuffer();
        usbController.flashHex(buffer, (prog) => {
            progress = prog;
        });
    };
</script>

<div>
    <button on:click={connectToMicrobitUsb}>Connect USB</button>
    <p>Connected to {name}</p>
    <button on:click={flashHex}>Flash hex file</button>
    <p>Flashing progress: {progress}</p>
</div>
