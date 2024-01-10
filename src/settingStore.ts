import { writable } from "svelte/store";
import { mqtt } from "ts-zeug";

export interface Settings {
  address?: string;
  connectPacket?: mqtt.OmitPacketType<mqtt.ConnectPacket>;
  subscription?: mqtt.MakeSerializePacketType<
    Omit<mqtt.SubscribePacket, "packet_identifier">
  >;
  parseMsgpack: boolean;
}

const defaultSettings: Settings = {
  address: "ws://localhost:1884",
  parseMsgpack: false,
  connectPacket: {},
  subscription: {
    subscriptions: [{
      topic: mqtt.asTopicFilter("#"),
      retain_as_published: true,
    }],
  },
};

export const settings = writable<Settings>(
  JSON.parse(localStorage.getItem("settings") ?? "") ?? defaultSettings,
);

settings.subscribe((value) => {
  localStorage.settings = JSON.stringify(value);
});
