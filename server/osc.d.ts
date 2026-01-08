declare module 'osc' {
  export interface OscMessage {
    address: string;
    args?: Argument[];
  }

  export type Argument = number | string | boolean | { type: string; value: unknown };

  export interface UDPPortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    metadata?: boolean;
  }

  export class UDPPort {
    constructor(options: UDPPortOptions);
    open(): void;
    close(): void;
    send(message: OscMessage): void;
    on(event: 'ready', callback: () => void): void;
    on(event: 'message', callback: (oscMsg: OscMessage) => void): void;
    on(event: 'error', callback: (err: Error) => void): void;
  }
}
