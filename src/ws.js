import { IN_BROWSER } from './constants';

let WebSocket = IN_BROWSER ? window.WebSocket : require('ws');

export default WebSocket;
