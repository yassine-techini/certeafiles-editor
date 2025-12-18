/**
 * PartyKit Yjs Server
 * Real-time collaboration backend using PartyKit
 */
import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class YjsPartyServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Use y-partykit's onConnect handler for Yjs synchronization
    return onConnect(conn, this.room, {
      // Persist document state
      persist: { mode: "snapshot" },
      // Enable awareness for cursor positions
      callback: {
        handler: (doc) => {
          // Optional: handle document updates
          console.log(`[YjsParty] Document updated in room: ${this.room.id}`);
        },
      },
    });
  }
}
