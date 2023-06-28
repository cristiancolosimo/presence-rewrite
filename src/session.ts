import { EventEmitter } from "koa";

export class MemoryStore extends EventEmitter {
    sessions: any = {};
    constructor() {
      super();
      this.sessions = {};
    }
    get(key:any, maxAge:any, { } = {}):any {
      return this.sessions[key];
    }
    set(key:any, session:any, maxAge:any, {  changed }:any = {}):any {
      if (changed) {
        this.sessions[key] = session;
        this.emit('changed', {
          key,
          session,
        });
      }
    }
    destroy(key: any) {
      delete this.sessions[key];
    }
  }