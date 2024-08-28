<script lang="ts">
    import type { Microbit } from "microbyte";

    export let microbit: Microbit;

    const usbController = microbit.getUsbController();
    $: name = "";
    const connectToMicrobitUsb = async () => {
        await usbController.connect();
        name = await usbController.getFriendlyName();
    };
</script>

<div>
    <button on:click={connectToMicrobitUsb}>Connect USB</button>
    {#if name !== ""}
        <p>Connected to {name}</p>
    {/if}
</div>
