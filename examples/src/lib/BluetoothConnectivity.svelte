<script lang="ts">
    import { MicrobitBluetoothDevice, Microbit } from "microbyte";
    import { writable } from "svelte/store";
    import { getMicrobitStatus } from "./util";
    import { onMount } from "svelte";
    import { MicrobitDeviceState } from "microbyte";

    export let microbit: Microbit;
    const microbitBluetooth = new MicrobitBluetoothDevice();
    microbit.setDevice(microbitBluetooth);

    const microbitStatus = writable(getMicrobitStatus(microbit));

    const connectToMicrobitBluetooth = async () => {
        microbit.connect();
    };

    const disconnectMicrobitBluetooth = async () => {
        microbit.disconnect();
    };

    const toggleAutoReconnect = async () => {
        microbit.setAutoReconnect(!microbit.isAutoReconnectEnabled());
    };

    const LEDMatrix = writable<boolean[][]>([
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
    ]);

    onMount(() => {
        const interval = setInterval(() => {
            microbitStatus.set(getMicrobitStatus(microbit));
        }, 100);
        return () => {
            microbit.disconnect();
            clearInterval(interval);
        };
    });
</script>

<div>
    <div style="text-align:left; font-size:10px">
        <pre>{JSON.stringify($microbitStatus, null, 2)}</pre>
    </div>
    <div class="microbitContainerButtons">
        <button on:click={connectToMicrobitBluetooth} style="margin-bottom: 8px;"> Connect Bluetooth </button>
        <button
            on:click={disconnectMicrobitBluetooth}
            style="margin-bottom: 8px;"
            disabled={$microbitStatus.statusConnected !== MicrobitDeviceState.CONNECTED}
        >
            Disconnect Bluetooth
        </button>
        <button
            on:click={toggleAutoReconnect}
            disabled={$microbitStatus.statusConnected !== MicrobitDeviceState.CONNECTED}
        >
            {$microbitStatus.reconnects ? "Disable" : "Enable"} Auto-Reconnect
        </button>
    </div>
    {#each $LEDMatrix as row, i}
        <div style="height: 20px; display:flex; flex-direction: row; margin-bottom:2px">
            {#each row as led, j}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    style="background-color: {led ? 'red' : 'white'}; width: 20px; height: 20px; margin: 2px;"
                    on:click={() => {
                        $LEDMatrix[i][j] = $LEDMatrix[i][j] ? false : true;
                        microbit.setLEDMatrix($LEDMatrix);
                    }}
                ></div>
            {/each}
        </div>
    {/each}
</div>
