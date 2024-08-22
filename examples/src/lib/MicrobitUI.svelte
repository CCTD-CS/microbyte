<script lang="ts">
    import { MicrobitBluetoothDevice, Microbit } from 'microbyte'
    import { writable } from 'svelte/store'
    import { getMicrobitStatus } from './util'
    import { onMount } from 'svelte'
    import { MicrobitDeviceState } from 'microbyte'

    export let microbit: Microbit

    const microbitBluetooth = new MicrobitBluetoothDevice() // Update UI
    microbit.setDevice(microbitBluetooth)
    const microbitStatus = writable(getMicrobitStatus(microbit))

    const connectToMicrobitBluetooth = async () => {
        microbit.connect()
    }

    const disconnectMicrobitBluetooth = async () => {
        microbit.disconnect()
    }

    const toggleAutoReconnect = async () => {
        microbit.setAutoReconnect(!microbit.isAutoReconnectEnabled())
    }

    onMount(() => {
        const interval = setInterval(() => {
            microbitStatus.set(getMicrobitStatus(microbit))
        }, 100)
        return () => {
            microbit.disconnect()
            clearInterval(interval)
        }
    })
</script>

<div class="microbitContainer">
    <p>Microbit</p>
    <div style="text-align:left; font-size:10px">
        <pre>{JSON.stringify($microbitStatus, null, 2)}</pre>
    </div>
    <div class="microbitContainerButtons">
        <button
            on:click={connectToMicrobitBluetooth}
            style="margin-bottom: 8px;"
        >
            Connect Bluetooth
        </button>
        <button
            on:click={disconnectMicrobitBluetooth}
            style="margin-bottom: 8px;"
            disabled={$microbitStatus.statusConnected !==
                MicrobitDeviceState.CONNECTED}
        >
            Disconnect Bluetooth
        </button>
        <button
            on:click={toggleAutoReconnect}
            disabled={$microbitStatus.statusConnected !==
                MicrobitDeviceState.CONNECTED}
        >
            {$microbitStatus.reconnects ? 'Disable' : 'Enable'} Auto-Reconnect
        </button>
    </div>
</div>
