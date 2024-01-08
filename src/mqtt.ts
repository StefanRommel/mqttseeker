
import {encode} from '@msgpack/msgpack';
import MQTT, {IClientPublishOptions, MqttClient} from 'mqtt/dist/mqtt.min';
import {writable} from 'svelte/store';

import {Settings, settings} from './settingStore';

export let tree = writable({});
export let online = writable(false);
export let topicStore = writable({});

export class Connection {
  mqtt: MqttClient;
  settings: Settings;
  tree: {label: string, children: []};
  topicStore = {}  // I'm not happy with this

  constructor() {
    settings.subscribe((value) => (this.settings = value));

    this.tree = {label: this.settings.url, children: []};
    tree.set(this.tree);
  }

  public async connect() {
    this.mqtt = await MQTT.connect(this.settings.url, {
      protocolVersion: 5,
      username: this.settings.username,
      password: this.settings.password,
    });

    this.settings.subscriptions.forEach((val) => {
      this.mqtt.subscribe([val.topic], {qos: val.qos});
    });

    this.mqtt.on('message', (topic, payload, packet) => {
      const pay = payload;
      // console.log(pay);
      if (pay.length > 0) {
        this.topicStore[topic] = {pay: pay, packet: packet};
        topicStore.set(this.topicStore);

        const topicPart = topic.split('/');
        topicPart.unshift(this.settings.url);
        let current = null;
        let existing = null;
        let i = 0;

        for (var y = 0; y < topicPart.length; y++) {
          if (y == 0) {
            if (!this.tree.children ||
                typeof this.tree.children == 'undefined') {
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
        tree.update((tree) => tree = this.tree);  // force tree update
      } else {
        delete this.topicStore[topic];
        topicStore.set(this.topicStore);
      }
    });

    this.mqtt.on('offline', () => {
      console.log('offline');
      online.set(false);
    });

    this.mqtt.on('connect', () => {
      console.log('online');
      online.set(true);
    });

    this.mqtt.on('disconnect', () => {
      console.log('disconnect');
    });

    this.mqtt.on('error', (error) => {
      console.error(`mqtt event error ${JSON.stringify(error)}`);
    });
  }

  public async disconnect() {
    console.log('end');
    this.mqtt.end();
    online.set(false);
    this.tree = {label: '', children: []};
    tree.set(this.tree);
  }

  public async publish(
      topic: string, message: string, inputType: 'JSON'|'raw',
      outputType: 'JSON'|'raw'|'msgpack', qos: 0|1|2, retain: boolean) {
    if (topic === '') return;


    let options:
        IClientPublishOptions = {qos: qos, retain: retain, properties: {}};
    if (message === '') {
      this.mqtt.publish(topic, '', options)
      return;
    }

    if (inputType === 'JSON') {
      switch (outputType) {
        case 'JSON':
        case 'raw':
          this.mqtt.publish(topic, JSON.stringify(JSON.parse(message)), options)
          break;
        case 'msgpack': {
          this.mqtt.publish(
              topic, encode(JSON.parse(message)) as Buffer, options);
          break;
        }
      }
    } else if (inputType === 'raw') {
      switch (outputType) {
        case 'JSON':
          this.mqtt.publish(topic, JSON.stringify(JSON.parse(message)), options)
          break;
        case 'raw':
          this.mqtt.publish(topic, message, options)
          break;
        case 'msgpack':
          this.mqtt.publish(topic, encode(message) as Buffer, options);
          break;
      }
    }
  }
}
