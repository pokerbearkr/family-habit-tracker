import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Use environment variable for WebSocket URL, fallback to localhost for development
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.pendingSubscriptions = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.client && this.connected) {
        resolve();
        return;
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        debug: (str) => {
          console.log('STOMP: ' + str);
        },
        onConnect: () => {
          console.log('WebSocket Connected');
          this.connected = true;

          // Process pending subscriptions
          this.pendingSubscriptions.forEach(({ destination, callback }) => {
            this._doSubscribe(destination, callback);
          });
          this.pendingSubscriptions = [];

          resolve();
        },
        onDisconnect: () => {
          console.log('WebSocket Disconnected');
          this.connected = false;
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          reject(frame);
        }
      });

      this.client.activate();
    });
  }

  _doSubscribe(destination, callback) {
    if (this.subscriptions.has(destination)) {
      return;
    }
    const subscription = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);
  }

  subscribe(destination, callback) {
    if (this.connected && this.client) {
      this._doSubscribe(destination, callback);
    } else {
      this.pendingSubscriptions.push({ destination, callback });
    }
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new WebSocketService();
