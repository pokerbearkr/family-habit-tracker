import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Use environment variable for WebSocket URL, fallback to localhost for development
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  connect(familyId, onMessageReceived) {
    if (this.client && this.connected) {
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

        // Subscribe to family habit updates
        this.client.subscribe(
          `/topic/family/${familyId}/habit-updates`,
          (message) => {
            const update = JSON.parse(message.body);
            onMessageReceived(update);
          }
        );
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        this.connected = false;
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new WebSocketService();
