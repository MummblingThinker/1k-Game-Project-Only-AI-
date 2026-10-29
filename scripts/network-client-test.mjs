import assert from 'node:assert/strict';
import { NetworkClient } from '../public/js/network.js';

// A late packet must not pull a player back into a room they just left.
const handlers = new Map();
const sent = [];
const states = [];
const socket = { on: (event, handler) => handlers.set(event, handler), emit: (...args) => sent.push(args) };
globalThis.window = { io: () => socket };
try {
  const client = new NetworkClient({ onState: (state) => states.push(state) });
  const connecting = client.ensureConnected();
  handlers.get('connect')();
  assert.equal(await connecting, true);
  const state = { roomCode: 'ABC234', players: [{ id: 'one' }], phase: 'playing' };
  handlers.get('roomJoined')({ roomCode: state.roomCode, playerId: 'one', playerCount: 1, state });
  assert.equal(client.inRoom, true);
  handlers.get('roomState')({ ...state, roomCode: 'XYZ567' });
  assert.equal(states.length, 1, 'foreign-room packet must be ignored');
  client.leaveRoom();
  assert.equal(states.at(-1), null);
  const count = states.length;
  handlers.get('roomState')(state);
  assert.equal(states.length, count, 'late room packet must not resurrect a departed session');
  assert.equal(client.inRoom, false);
  assert.equal(sent.at(-1)[0], 'leaveRoom');
  handlers.get('disconnect')();
  assert.equal(client.roomCode, null);
  assert.equal(client.playerId, null);
  console.log('Network client PASS: foreign/late room packets ignored; leave/disconnect clear membership.');
} finally { delete globalThis.window; }
