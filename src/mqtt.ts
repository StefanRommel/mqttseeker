import { encode } from "@msgpack/msgpack";
import { writable } from "svelte/store";
import * as tszeug from "ts-zeug";

import { type Settings } from "./settingStore";

export let tree = writable<any>({});
export let online = writable(false);
export let topicStore = writable<any>({});

/*
async function dings() {
  const client = new tszeug.mqtt.Client(
    //"ws://192.168.178.92:1884",
    "ws://localhost:1884",
    {
      keepalive: 1 as tszeug.mqtt.Seconds,
      // will: {
      //   topic: mqtt.asTopic("hi"),
      //   retain: true,
      // },
    },
    { alwaysTryToDecodePayloadAsUTF8String: true },
  );

  for await (
    const p of tszeug
      .helper.streamAsyncIterator(client.readable)
  ) {
    //mqtt.logPacket(p);
    switch (p.type) {
      case tszeug.mqtt.ControlPacketType.ConnAck: {
        if (p.connect_reason_code !== tszeug.mqtt.ConnectReasonCode.Success) {
          console.error("%cCouldn't connect", "color: red", p);
          break;
        }
        tszeug.mqtt.logPacket(
          await client.subscribe({
            subscriptions: [{
              topic: tszeug.mqtt.asTopicFilter("#"),
              retain_as_published: true,
            }],
            properties: { subscription_identifier: 5 },
          }),
        );
        // await client.publish({
        //   topic: mqtt.asTopic("hi"),
        //   payload: "wie gehts?",
        //   retain: true,
        // });
        break;
      }
      case tszeug.mqtt.ControlPacketType.Publish: {
        if (p.payload === undefined) {
          console.log(
            `%c${p.topic}`,
            `${p.retain ? "color: blue;" : ""} font-weight: bold`,
          );
        } else {
          try {
            console.log(
              `%c${p.topic}`,
              `${p.retain ? "color: blue;" : ""} font-weight: bold`,
              JSON.parse(p.payload as string),
            );
          } catch {
            console.log(
              `%c${p.topic}`,
              `${p.retain ? "color: blue;" : ""} font-weight: bold`,
              p.payload as string,
            );
          }
        }
        break;
      }
      case tszeug.mqtt.ControlPacketType.Disconnect: {
        console.log("%cDisconnect", "color: red", p);
        break;
      }
      case tszeug.mqtt.CustomPacketType.ConnectionClosed: {
        console.log("%cConnectionClosed", "color: red", p);
        break;
      }
      case tszeug.mqtt.CustomPacketType.Error: {
        console.error("%cError", "color: red", p);
        break;
      }
    }
  }

  console.log("%cexiting", "color: red");
}
dings();*/

export class Connection {
  client?: tszeug.mqtt.Client;
  settings: Settings;
  tree: { label: string; children: [] };
  topicStore = {}; // I'm not happy with this

  constructor() {
    settings.subscribe((value) => (this.settings = value));

    this.tree = { label: this.settings.address, children: [] };
    tree.set(this.tree);
  }

  public async connect(settings: Settings) {
    if (this.settings) {
      this.client = new tszeug.mqtt.Client(
        this.settings.address,
        this.settings.connectPacket,
      );
    }

    this.settings.subscriptions.forEach((val) => {
      this.client!.subscribe([val.topic], { qos: val.qos });
    });

    this.client.on("message", (topic, payload, packet) => {
      const pay = payload;
      // console.log(pay);
      if (pay.length > 0) {
        this.topicStore[topic] = { pay: pay, packet: packet };
        topicStore.set(this.topicStore);

        const topicPart = topic.split("/");
        topicPart.unshift(this.settings.address);
        let current = null;
        let existing = null;
        let i = 0;

        for (let y = 0; y < topicPart.length; y++) {
          if (y == 0) {
            if (
              !this.tree.children ||
              typeof this.tree.children == "undefined"
            ) {
              this.tree = {
                label: topicPart[y],
                children: [],
              };
            }
            current = this.tree.children;
          } else {
            existing = null;
            for (i = 0; i < current.length; i++) {
              if (current[i].label === topicPart[y]) {
                existing = current[i];
                break;
              }
            }
            if (existing) {
              current = existing.children;
            } else {
              current.push({
                label: topicPart[y],
                children: [],
              });
              current = current[current.length - 1].children;
            }
          }
        }
        tree.update((tree) => tree = this.tree); // force tree update
      } else {
        delete this.topicStore[topic];
        topicStore.set(this.topicStore);
      }
    });

    this.client.on("offline", () => {
      console.log("offline");
      online.set(false);
    });

    this.client.on("connect", () => {
      console.log("online");
      online.set(true);
    });

    this.client.on("disconnect", () => {
      console.log("disconnect");
    });

    this.client.on("error", (error) => {
      console.error(`mqtt event error ${JSON.stringify(error)}`);
    });
  }

  public disconnect() {
    console.log("end");
    this.client!.end();
    online.set(false);
    this.tree = { label: "", children: [] };
    tree.set(this.tree);
  }

  public publish(
    topic: string,
    message: string,
    inputType: "JSON" | "raw",
    outputType: "JSON" | "raw" | "msgpack",
    qos: 0 | 1 | 2,
    retain: boolean,
  ) {
    if (topic === "") return;

    const options = {
      qos: qos,
      retain: retain,
      properties: {},
    };
    if (message === "") {
      this.client.publish(topic, "", options);
      return;
    }

    if (inputType === "JSON") {
      switch (outputType) {
        case "JSON":
        case "raw":
          this.client.publish(
            topic,
            JSON.stringify(JSON.parse(message)),
            options,
          );
          break;
        case "msgpack": {
          this.client.publish(
            topic,
            encode(JSON.parse(message)) as Buffer,
            options,
          );
          break;
        }
      }
    } else if (inputType === "raw") {
      switch (outputType) {
        case "JSON":
          this.client.publish(
            topic,
            JSON.stringify(JSON.parse(message)),
            options,
          );
          break;
        case "raw":
          this.client.publish(topic, message, options);
          break;
        case "msgpack":
          this.client.publish(topic, encode(message) as Buffer, options);
          break;
      }
    }
  }
}
