<script lang="ts">
    import Navbar from "./Navbar.svelte"
    import TopicViewer from "./TopicViewer.svelte"
    import {Styles} from "@sveltestrap/sveltestrap"

    import {Connection} from "./mqtt"
    let con = new Connection()
</script>

<Styles />
<Navbar bind:con />
<TopicViewer bind:con />

<style>
</style>
