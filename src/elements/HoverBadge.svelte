<script lang="ts">
    export let text: string
    export let simplify: boolean = false
    let hovering

    function enter() {
        hovering = true
    }

    function leave() {
        hovering = false
    }
</script>

{#if text}
    {#if simplify}
        <span class="badge text-secondary" on:mouseenter={enter} on:mouseleave={leave}>
            <div class="innertext"><i>{text}</i></div>
        </span>
    {:else}
        <span class="badge {!hovering ? `bg-light` : `bg-secondary`} {hovering ? `text-white` : `text-dark`} " on:mouseenter={enter} on:mouseleave={leave}>
            <div>{text}</div>
        </span>
    {/if}
{/if}

<style>
    .innertext {
        white-space: nowrap; /*keep text on one line */
        overflow: hidden; /*prevent text from being shown outside the border */
        text-overflow: ellipsis; /*cut off text with an ellipsis*/
        max-width: 500px;
        font-weight:300;
    }
</style>
