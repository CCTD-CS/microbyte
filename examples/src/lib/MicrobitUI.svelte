<script lang="ts">
    import { Microbit, MicrobitBluetoothDevice } from "microbyte";
    import BluetoothConnectivity from "./BluetoothConnectivity.svelte";
    import UsbConnectivity from "./USBConnectivity.svelte";

    export let microbit: Microbit;
</script>

<div class="microbitContainer">
    <p>Microbit</p>
    <hr style="width: 100%" />
    <p>Bluetooth</p>
    <BluetoothConnectivity {microbit} />
    <hr style="width: 100%" />
    <p>USB</p>
    <UsbConnectivity {microbit} />
</div>
