<script lang="ts">
    import Hamburger from "./elements/Hamburger.svelte";
    import { settings } from "./settingStore";
    import { type Connection, online } from "./mqtt";

    export let con: Connection;

    let clicked = true;
    function clickHandler() {
        clicked = !clicked;
    }

    let connected = false;
    function toggleConnection() {
        if (!connected) {
            con.connect($settings);
        } else {
            con.disconnect();
        }
        connected = !connected;
    }

    let newTopic = "";
    let QoS = "0";
    function addTopic() {
        //TODO: if we are connected we have to issue the subscriptions and unsubscriptions here
        const index = $settings.subscriptions.findIndex(
            (x) => x.topic == newTopic,
        );

        if (index === -1) {
            $settings.subscriptions.push({
                topic: newTopic,
                qos: (() => {
                    switch (QoS) {
                        case "1":
                            return 1;
                        case "2":
                            return 2;
                        default:
                            return 0;
                    }
                })(),
            });
            $settings.subscriptions = $settings.subscriptions; // force update
        } else {
            // todo
        }
    }

    function removeTopic(val: string) {
        const index = $settings.subscriptions.findIndex((x) => x.topic == val);
        if (index > -1) {
            $settings.subscriptions.splice(index, 1);
        }
        $settings.subscriptions = $settings.subscriptions;
    }
</script>

<nav class="navbar navbar-dark bg-dark sds-navbar">
    <div class="container-fluid">
        <Hamburger on:click={clickHandler} />
        <span class="navbar-text text-white noselect">MQTT Seeker</span>
        <form class="d-flex">
            <span class="badge {$online ? 'bg-success' : 'bg-danger'}">
                {$online ? $settings.address : "disconnected"}
            </span>
        </form>
    </div>
</nav>

<div class="mymodal {clicked ? 'show' : 'hide'}">
    <div class="modal-content mymodal-content">
        <div class="modal-header">
            <h5 class="modal-title">Settings</h5>
            <button
                type="button"
                class="btn-close"
                disabled={!connected}
                on:click={clickHandler}
            />
        </div>
        <div class="modal-body">
            <div class="input-group mb-3">
                <select
                    class="form-select d-flex"
                    bind:value={$settings.protocol}
                    disabled={connected}
                >
                    <option>ws://</option>
                </select>
                <input
                    type="text"
                    class="form-control"
                    placeholder="Host"
                    disabled={connected}
                    bind:value={$settings.host}
                />
                <span class="input-group-text">:</span>
                <input
                    type="text"
                    class="form-control"
                    placeholder="Port"
                    disabled={connected}
                    bind:value={$settings.port}
                />
                <span class="input-group-text">/</span>
                <input
                    type="text"
                    class="form-control"
                    placeholder="BasePath"
                    disabled={connected}
                    bind:value={$settings.basePath}
                />
            </div>
            <div class="input-group mb-3">
                <span class="input-group-text">Username</span>
                <input
                    type="text"
                    class="form-control"
                    disabled={connected}
                    bind:value={$settings.connectPacket?.username}
                />
                <span class="input-group-text">Password</span>
                <input
                    type="password"
                    class="form-control"
                    disabled={connected}
                    bind:value={$settings.password}
                />
            </div>

            <div class="input-group mb-3">
                <span class="input-group-text">Topic</span>
                <input
                    type="text"
                    class="form-control"
                    disabled={connected}
                    bind:value={newTopic}
                />
                <span class="input-group-text">QoS</span>
                <select
                    class="form-select d-flex qos"
                    bind:value={QoS}
                    disabled={connected}
                >
                    <option>0</option>
                    <option>1</option>
                    <option>2</option>
                </select>
                <button
                    class="btn btn-secondary"
                    type="button"
                    on:click={addTopic}
                    disabled={connected}
                    >Add
                </button>
            </div>

            <table class="table mb-3">
                <thead>
                    <tr>
                        <th scope="col">Topic</th>
                        <th scope="col qos">QoS</th>
                        <th scope="col ">Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {#each $settings.subscriptions as sub (sub.topic)}
                        <tr>
                            <td>{sub.topic}</td>
                            <td>{sub.qos}</td>
                            <td on:click={() => removeTopic(sub.topic)}
                                ><svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    class="bi bi-trash"
                                    viewBox="0 0 16 16"
                                >
                                    <path
                                        d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
                                    />
                                    <path
                                        fill-rule="evenodd"
                                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                                    />
                                </svg></td
                            >
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="form-check form-switch">
            <input
                class="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                bind:checked={$settings.parseMsgpack}
            />
            <label class="form-check-label" for="flexSwitchCheckDefault">
                Parse msgpack
            </label>
        </div>

        <div class="modal-footer">
            <div class="btn-group" role="group">
                <button
                    type="button"
                    class="btn {connected
                        ? 'btn-success'
                        : 'btn-outline-success'}"
                    on:click={toggleConnection}
                    disabled={connected}
                >
                    Connect
                </button>
                <button
                    type="button"
                    class="btn {connected
                        ? 'btn-outline-danger'
                        : 'btn-danger'} "
                    on:click={toggleConnection}
                    disabled={!connected}
                >
                    Disconnect
                </button>
            </div>
            <button
                type="button"
                class="btn btn-secondary"
                on:click={clickHandler}
                disabled={!connected}
            >
                Close
            </button>
        </div>
    </div>
</div>

<style>
    .sds-navbar {
        position: sticky;
        top: 0;
    }

    .mymodal {
        position: fixed;
        top: 50px;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 1050;
        background-color: #00000055;
    }

    .mymodal-content {
        margin-top: 100px;
        margin-left: 10%;
        width: 80%;
        min-height: 500px;
        background-color: #fff;
        border-radius: 10px;
        padding: 10px 15px;
    }

    .show {
        display: block;
    }

    .hide {
        display: none;
    }

    .noselect {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .qos {
        max-width: 60px;
    }
</style>
