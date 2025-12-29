import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(user) {
    if (this.socket) {
      this.disconnect();
    }

    const serverUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
      
      // Join team room
      if (user?.teamId) {
        this.socket.emit('join-team', user.teamId);
        console.log('Joined team room:', user.teamId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Message events
  onMessageReceived(callback) {
    if (this.socket) {
      this.socket.on('message-received', callback);
    }
  }

  offMessageReceived(callback) {
    if (this.socket) {
      this.socket.off('message-received', callback);
    }
  }

  // Task events
  onTaskUpdated(callback) {
    if (this.socket) {
      this.socket.on('task-update-received', callback);
    }
  }

  offTaskUpdated(callback) {
    if (this.socket) {
      this.socket.off('task-update-received', callback);
    }
  }

  // Project events
  onProjectUpdated(callback) {
    if (this.socket) {
      this.socket.on('project-update-received', callback);
    }
  }

  offProjectUpdated(callback) {
    if (this.socket) {
      this.socket.off('project-update-received', callback);
    }
  }

  // Emit events
  emitNewMessage(teamId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new-message', { teamId, message });
    }
  }

  emitTaskUpdate(teamId, task) {
    if (this.socket && this.isConnected) {
      this.socket.emit('task-updated', { teamId, task });
    }
  }

  emitProjectUpdate(teamId, project) {
    if (this.socket && this.isConnected) {
      this.socket.emit('project-updated', { teamId, project });
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;