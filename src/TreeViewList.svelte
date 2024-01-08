<script context="module">
    const _expansionState = {}
</script>

<script lang="ts">
    import {topicStore} from "./mqtt"
    import HoverBadge from "./elements/HoverBadge.svelte"
    import {settings} from "./settingStore"

    export let tree
    export let level = 0
    $: label = tree.label ?? ""
    $: topic_message = tree.topic_message ?? ""
    $: children = tree.children ?? []

    $: topicStoreItem = $topicStore[getWholeTopicName()]

    export let topic = ""

    let expanded = _expansionState[label] || false
    const toggleExpansion = () => {
        expanded = _expansionState[label] = !expanded
    }
    $: arrowDown = expanded
    $: labelText = ""

    $: {
        let text = ""
        if (level !== 0) {
            text += label + " (" + children.length + " topics)"
        } else text += $settings.url

        labelText = text + " " + topic_message
    }

    export let clickHandler

    function getWholeTopicName() {
        if (level === 0) return undefined
        if (!topic) return label
        return topic.substring(1) + "/" + label
    }

    $: messageDetail = $topicStore[getWholeTopicName()]
    $: payload = messageDetail ? messageDetail.pay : ""
</script>

<ul class="list-unstyled">
    {#if level === 0 || children.length > 0}
        <li>
            <span on:click={toggleExpansion} on:click={clickHandler(getWholeTopicName())}>
                <span class="fs-6">
                    {#if arrowDown}&#9662{:else}&#x25b8{/if}
                </span>
                <HoverBadge text={labelText} />
                <HoverBadge text={payload} simplify />
            </span>
            {#if expanded}
                {#each children as child (child.label)}
                    <svelte:self tree={child} level={level + 1} topic={level === 0 ? topic : topic + "/" + label} {clickHandler} />
                {/each}
            {/if}
        </li>
    {:else}
        <li>
            <span on:click={clickHandler(getWholeTopicName())}>
                <span class="no-arrow" />
                {#if topicStoreItem != undefined}
                    <HoverBadge text={label} />
                    <HoverBadge text={payload} simplify />
                {:else}
                    <HoverBadge text="{label} (deleted)" />
                {/if}
            </span>
        </li>
    {/if}
</ul>

<style>
    ul {
        margin: 0;
        list-style: none;
        padding-left: 1.2rem;
        user-select: none;
    }
    .no-arrow {
        padding-left: 1rem;
    }
</style>
