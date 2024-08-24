<script lang="ts">
    import { writable, type Writable } from "svelte/store";
    import { MBSpecs, Microbit, MicrobitBluetoothDevice } from "microbyte";
    import { getMicrobitStatus } from "./util";
    import { onMount } from "svelte";
    import MicrobitUi from "./MicrobitUI.svelte";

    let btDevice: BluetoothDevice | undefined;
    let manualMicrobit: Writable<Microbit | undefined> = writable(undefined);
    let manualMicrobitStatus: Writable<string | undefined> = writable(undefined);
    const requestDevice = async () => {
        // Requesting a bluetooth device manually (not needed, just for example. Using the Microbit.connect() method is sufficient)
        const filters = [{ namePrefix: `BBC micro:bit` }];
        btDevice = await navigator.bluetooth.requestDevice({
            filters: filters,
            optionalServices: [
                MBSpecs.Services.UART_SERVICE,
                MBSpecs.Services.ACCEL_SERVICE,
                MBSpecs.Services.DEVICE_INFO_SERVICE,
                MBSpecs.Services.LED_SERVICE,
                MBSpecs.Services.IO_SERVICE,
                MBSpecs.Services.BUTTON_SERVICE,
            ],
        });
    };

    const assignDevice = () => {
        $manualMicrobit = new Microbit();
        if (btDevice !== undefined && manualMicrobit !== undefined) {
            $manualMicrobit.setDevice(new MicrobitBluetoothDevice(btDevice));
        }
    };

    onMount(() => {
        const interval = setInterval(() => {
            if ($manualMicrobit !== undefined) {
                $manualMicrobitStatus = JSON.stringify(getMicrobitStatus($manualMicrobit));
            }
            return () => {
                clearInterval(interval);
            };
        });
    });
</script>

<div>
    <button on:click={requestDevice}> RequestDevice (Device: {btDevice}) </button>
    {#if btDevice !== undefined}
        <button on:click={assignDevice}> Assign device to microbit </button>
    {/if}
    {#if $manualMicrobit !== undefined}
        <div>
            <MicrobitUi microbit={$manualMicrobit} />
        </div>
    {/if}
</div>
