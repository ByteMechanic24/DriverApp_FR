import io from 'socket.io-client';

class SocketService {
  static socket = null;
  static isConnected = false;
  
  // Connect to Socket.io server
  static connect(serverUrl = 'https://smartbus-backend-production.up.railway.app') {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      this.socket.on('connect', () => {
        console.log('Socket.io connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        this.isConnected = false;
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket.io reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('Socket.io reconnection error:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Socket.io reconnection failed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Error creating socket connection:', error);
    }
  }

  // Disconnect from Socket.io server
  static disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket.io disconnected');
    }
  }

  // Join a room (for driver-specific communication)
  static joinRoom(driverId, busId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-driver-room', { driverId, busId });
      console.log(`Joined driver room: ${driverId}-${busId}`);
    } else {
      console.warn('Cannot join room: Socket not connected');
    }
  }

  // Leave a room
  static leaveRoom(driverId, busId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-driver-room', { driverId, busId });
      console.log(`Left driver room: ${driverId}-${busId}`);
    }
  }

  // Send location update via Socket.io (for real-time broadcasting)
  static emitLocationUpdate(locationData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver-location-update', locationData);
      console.log('Location update sent via Socket.io:', locationData);
    } else {
      console.warn('Cannot emit location: Socket not connected');
    }
  }

  // Listen for server messages
  static on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  static off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Check connection status
  static getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
    };
  }

  // Send custom event
  static emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`);
    }
  }

  // Test connection with ping
  static testConnection() {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve(false);
        return;
      }

      const startTime = Date.now();
      this.socket.emit('ping', { timestamp: startTime }, (response) => {
        const latency = Date.now() - startTime;
        console.log(`Socket.io ping: ${latency}ms`);
        resolve(true);
      });

      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000);
    });
  }
}

export default SocketService;