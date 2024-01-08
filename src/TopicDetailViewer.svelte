<script lang="ts">
  import HoverBadge from "./elements/HoverBadge.svelte";
  import Clipboard from "./elements/Clipboard.svelte";
  import type { Connection } from "./mqtt";
  import { decode } from "@msgpack/msgpack";

  import { topicStore } from "./mqtt";

  let code = undefined;
  let propertiesCode = undefined;
  let interpretation = "empty";

  import hljs from "highlight.js/lib/core";
  import hljsSvelte from "highlightjs-svelte/dist/index";
  import json from "highlight.js/lib/languages/json";
  import "highlight.js/styles/stackoverflow-light.css";

  export let selectedTopic;
  export let con: Connection;

  hljsSvelte(hljs);

  hljs.registerLanguage("json", json);

  let outputTopic = "";
  let inputType: "JSON" | "raw" = "JSON";
  let outputType: "JSON" | "raw" | "msgpack" = "JSON";
  let outputQoS: string = "0";
  let outputRetain = true;
  let outputText = "{}";
  $: parseMsgpack = false;

  $: messageDetail = $topicStore[selectedTopic];
  $: payload = messageDetail ? messageDetail.pay : "";
  $: packet = messageDetail ? messageDetail.packet : "";

  $: {
    console.log(parseMsgpack);
    let value;
    if (selectedTopic) value = payload;
    if (typeof value === "undefined") {
      interpretation = "empty";
      code = "";
    } else {
      try {
        let res;
        if (parseMsgpack) {
          console.log("1", value);
          res = decode(value as Uint8Array);
        } else {
          res = JSON.parse(value.toString());
          console.log("2", res);
        }
        console.log("3", value);

        code = hljs.highlight(JSON.stringify(res, null, 2), {
          language: "json",
        }).value;
        interpretation = "json";
      } catch (e) {
        console.warn(e);
        code = value.toString();
        interpretation = "raw";
      }
    }
  }

  $: {
    try {
      propertiesCode = hljs.highlight(
        JSON.stringify(packet?.properties, null, 2),
        {
          language: "json",
        }
      ).value;
    } catch {
      propertiesCode = undefined;
    }
  }

  function setOutputTopic() {
    outputTopic = selectedTopic;
  }

  function publish() {
    let qos: 0 | 1 | 2;

    if (parseInt(outputQoS) === 0) qos = 0;
    else if (parseInt(outputQoS) === 1) qos = 1;
    else if (parseInt(outputQoS) === 2) qos = 2;
    else qos = 0;

    con.publish(
      outputTopic,
      outputText,
      inputType,
      outputType,
      qos,
      outputRetain
    );
  }
</script>

<div class="fixedHeight">
  <div class="card mycard">
    <h5 class="card-header">Topic</h5>
    <div class="card-body">
      <p class="card-title">Topic Name:</p>
      <p class="card-text">
        {#if selectedTopic}
          {#each selectedTopic.split("/") as topicPart, i}
            {#if i != 0}/{/if}
            <HoverBadge text={topicPart} />
          {/each}
          <Clipboard copyText={selectedTopic} />
        {:else}
          <HoverBadge text="No topic selected" />
        {/if}
      </p>
    </div>
  </div>

  <div class="card mycard">
    <h5 class="card-header">Value</h5>
    <div class="card-body">
      <p class="card-text">
        Interpretation: <HoverBadge text={interpretation} />
        <Clipboard copyText={payload} />
      </p>

      <pre><code class="language-json hljs codeBig">{@html code}</code></pre>
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          id="flexSwitchCheckDefault"
          bind:checked={parseMsgpack}
        />
        <label class="form-check-label" for="flexSwitchCheckDefault">
          Parse msgpack
        </label>
      </div>
    </div>
  </div>

  <div class="card mycard">
    <h5 class="card-header">Packet Details</h5>
    <div class="card-body">
      <p class="card-text">
        QoS: <HoverBadge text={packet.qos} /> Retain: <HoverBadge
          text={packet.retain}
        />
      </p>
      <p class="card-text">Properties:</p>
      <pre><code class="language-json hljs codeSmall"
          >{@html propertiesCode}</code
        ></pre>
    </div>
  </div>

  <div class="card mycard">
    <h5 class="card-header">Publish</h5>
    <div class="card-body">
      <div class="input-group mb-3">
        <span class="input-group-text">Topic</span>
        <input type="text" class="form-control" bind:value={outputTopic} />
        <button
          class="btn btn-outline-secondary"
          type="button"
          on:click={setOutputTopic}
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-box-arrow-left"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0v2z"
            />
            <path
              fill-rule="evenodd"
              d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z"
            />
          </svg>
        </button>
      </div>
      <div class="input-group mb-3">
        <textarea
          class="form-control my-form-control"
          bind:value={outputText}
        />
        <button
          class="btn btn-outline-secondary"
          type="button"
          on:click={publish}>Publish</button
        >
      </div>
      <div class="input-group mb-3">
        <span class="input-group-text">Input</span>
        <select class="form-select d-flex" bind:value={inputType}>
          <option>JSON</option>
          <option>raw</option>
        </select>
        <span class="input-group-text">Output</span>
        <select class="form-select d-flex" bind:value={outputType}>
          <option>JSON</option>
          <option>msgpack</option>
          <option>raw</option>
        </select>
        <span class="input-group-text">QoS</span>
        <select class="form-select d-flex" bind:value={outputQoS}>
          <option>0</option>
          <option>1</option>
          <option>2</option>
        </select>
        <span class="input-group-text">Retain</span>
        <div class="input-group-text">
          <input
            class="form-check-input mt-0"
            type="checkbox"
            bind:checked={outputRetain}
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .codeBig {
    height: 200px;
    max-width: 700px;
    min-width: 700px;
  }
  .mycard {
    margin: 10px;
  }
  .hljs {
    font-size: 10px;
  }

  .codeSmall {
    height: 100px;
    max-width: 700px;
    min-width: 700px;
  }

  .fixedHeight {
    margin-top: 1rem;
    margin-bottom: 1rem;
    height: calc(100vh - 6rem);
    overflow: auto;
  }

  .my-form-control {
    height: 200px;
    font-size: 12px;
  }
</style>
