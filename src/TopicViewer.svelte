<script lang="ts">
  import TopicDetailViewer from "./TopicDetailViewer.svelte";
  import TreeViewList from "./TreeViewList.svelte";
  import type { Connection } from "./mqtt";
  export let con: Connection;

  import { tree } from "./mqtt";

  $: selectedTopic = "";
  function topicSelected(topic) {
    selectedTopic = topic;
  }
</script>

<div class="row">
  <div class="col">
    <div class="fixedHeight">
      <TreeViewList tree={$tree} clickHandler={topicSelected} />
    </div>
  </div>
  <div class="col">
    <TopicDetailViewer {selectedTopic} bind:con />
  </div>
</div>

<style>
  .fixedHeight {
    margin-top: 1rem;
    margin-bottom: 1rem;
    height: calc(100vh - 6rem);
    overflow: auto;
  }
</style>
