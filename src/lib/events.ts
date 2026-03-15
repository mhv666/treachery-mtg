import { EventEmitter } from 'node:events';

declare global {
  var gameEvents: EventEmitter | undefined;
}

if (!global.gameEvents) {
  global.gameEvents = new EventEmitter();
  global.gameEvents.setMaxListeners(100);
}

export const gameEvents = global.gameEvents!;
