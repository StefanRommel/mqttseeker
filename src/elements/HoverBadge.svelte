<script lang="ts">
    export let text: string
    let hovering

    function enter() {
        hovering = true
    }

    function leave() {
        hovering = false
    }
</script>

<span class="badge {!hovering ? `bg-light` : `bg-secondary`} {hovering ? `text-white` : `text-dark`} " on:mouseenter={enter} on:mouseleave={leave}>
    <!-- <span bind:this={div}>{text}</span> -->
    <div class="asd">{text}</div>
</span>

<style>
    .asd {
        white-space: nowrap; /*keep text on one line */
        overflow: hidden; /*prevent text from being shown outside the border */
        text-overflow: ellipsis; /*cut off text with an ellipsis*/
        max-width: 500px;
    }
</style>
