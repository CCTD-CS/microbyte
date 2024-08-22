<script lang="ts">
  import { Microbit } from "microbyte";
  import MicrobitUi from "./lib/MicrobitUI.svelte";
  import { writable } from "svelte/store";
  const microbits = writable([new Microbit()]);
  const addMicrobit = () => {
    microbits.update((microbits) => [...microbits, new Microbit()]);
  };

  const removeMicrobit = () => {
    microbits.update((microbits) => microbits.slice(0, -1));
  };
</script>

<main>
  <div style="margin-bottom: 8px;">
    <button on:click={addMicrobit}> Add Microbit </button>
    <button on:click={removeMicrobit}> Remove Microbit </button>
  </div>
  <div class="grid">
    {#each $microbits as microbit}
      <MicrobitUi {microbit} />
    {/each}
  </div>
</main>
