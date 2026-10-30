export class NetworkClient {
  constructor({ onStatus = () => {}, onState = () => {}, onDiagnostics = () => {} } = {}) {
    this.onStatus = onStatus;
    this.onState = onState;
    this.onDiagnostics = onDiagnostics;
    this.socket = null;
    this.connected = false;
    this.roomCode = null;
    this.playerId = null;
    this.latestState = null;
    this.lastInputAt = 0;
    this.connectPromise = null;
  }

  async ensureConnected() {
    if (this.connected && this.socket) return true;
    if (this.connectPromise) return this.connectPromise;
    if (typeof window.io !== 'function') {
      this.onStatus('Multiplayer server is not running. Offline play is available.', false);
      return false;
    }
    this.connectPromise = new Promise((resolve) => {
      const socket = window.io({ reconnection: false, timeout: 2500 });
      this.socket = socket;
      let finished = false;
      const settle = (ok) => {
        if (finished) return;
        finished = true;
        this.connectPromise = null;
        resolve(ok);
      };
      socket.on('connect', () => {
        this.connected = true;
        this.onStatus('Connected to game server.', true);
        settle(true);
      });
      socket.on('connect_error', () => {
        this.connected = false;
        this.onStatus('Cannot reach the game server. Try again shortly. Offline play is available.', false);
        settle(false);
      });
      socket.on('disconnect', () => {
        this.connected = false;
        this.roomCode = null;
        this.playerId = null;
        this.latestState = null;
        this.onState(null);
        this.onStatus('Connection lost. Reconnect and join a new lobby.', false);
      });
      socket.on('roomJoined', (data) => {
        this.roomCode = data.roomCode;
        this.playerId = data.playerId;
        this.latestState = data.state || null;
        this.onStatus(`Room ${data.roomCode} · ${data.playerCount} player${data.playerCount===1?'':'s'}`, true);
        if (this.latestState) this.onState(this.latestState);
      });
      socket.on('roomState', (data) => {
        if (!this.inRoom || data.roomCode !== this.roomCode) return;
        this.latestState = data;
        this.onState(data);
        this.onStatus(`Room ${data.roomCode} / ${data.players.length} players / ${data.phase}`, true);
      });
      socket.on('roomError', (message) => this.onStatus(String(message || 'Room error.'), this.connected));
      socket.on('diagnostics',data=>{
        if(this.inRoom&&data?.roomCode===this.roomCode&&data.runId===this.latestState?.runId)this.onDiagnostics(data.report);
      });
    });
    return this.connectPromise;
  }

  async createRoom() {
    const ok = await this.ensureConnected();
    if (!ok) return false;
    this.socket.emit('createRoom');
    return true;
  }

  async joinRoom(code) {
    const normalized = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (normalized.length !== 6) {
      this.onStatus('Enter the six-character room code.', this.connected);
      return false;
    }
    const ok = await this.ensureConnected();
    if (!ok) return false;
    this.socket.emit('joinRoom', { roomCode: normalized });
    return true;
  }

  sendInput(input, force = false) {
    if (!this.connected || !this.socket || !this.roomCode) return;
    const now = performance.now();
    if (!force && now - this.lastInputAt < 30) return;
    this.lastInputAt = now;
    this.socket.emit('input', {
      left: !!input.left,
      right: !!input.right,
      jump: !!input.jump,
      up: !!input.up, down: !!input.down,
    });
  }

  interact() { if (this.inRoom) this.socket.emit('interact'); }
  requestDiagnostics() { if(this.inRoom)this.socket.emit('getDiagnostics'); }
  startRun() { if (this.inRoom) this.socket.emit('startRun'); }
  setReady(ready) { if (this.inRoom) this.socket.emit('ready', { ready: !!ready }); }
  restartRun() { if (this.inRoom) this.socket.emit('restartRun'); }
  nextLevel() {
    if (!this.inRoom) return;
    if (this.latestState?.phase === 'victory') this.socket.emit('nextLevel');
    else if (this.latestState?.phase === 'cutscene') this.socket.emit('skipStory');
  }
  selectLevel(level) { if (this.inRoom) this.socket.emit('selectLevel', { level }); }
  action(action) { if (this.inRoom && ['carry', 'drop'].includes(action)) this.socket.emit(action); }

  leaveRoom() {
    if (this.socket && this.roomCode) this.socket.emit('leaveRoom');
    this.roomCode = null;
    this.playerId = null;
    this.latestState = null;
    this.onStatus(this.connected ? 'Connected · no room' : 'No room connected.', this.connected);
    this.onState(null);
  }

  get inRoom() { return !!this.roomCode && !!this.connected; }
}
