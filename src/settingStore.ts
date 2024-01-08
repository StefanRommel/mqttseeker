import {writable} from 'svelte/store';

export interface Settings {
  username?: string;
  password?: string;
  protocol: 'ws://'|'mqtt://';
  host: string;
  port: number;
  basePath?: string;
  url: string
  subscriptions: Array<SubscribeTopic>;
}

export interface SubscribeTopic {
  topic: string;
  qos: 0|1|2;
}

const defaultSettings: Settings = {
  username: 'stefan',
  password: 'stefan',
  protocol: 'ws://',
  host: '192.168.50.100',
  port: 1884,
  url: 'ws://192.168.50.100:',
  subscriptions: [{topic: '#', qos: 0}]
};

export const settings = writable<Settings>(
    JSON.parse(localStorage.getItem('settings')) || defaultSettings);

settings.subscribe((value) => {
  value.url = value.protocol + value.host;
  if (value.port) value.url += ':' + value.port;
  if (value.basePath) value.url += '/' + value.basePath;
  localStorage.settings = JSON.stringify(value);
});
