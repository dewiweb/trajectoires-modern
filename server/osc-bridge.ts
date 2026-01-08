import osc from 'osc';
import { EventEmitter } from 'events';
import type { OSCConfig } from '../shared/types.js';

export class OSCBridge extends EventEmitter {
  private udpPort: osc.UDPPort;
  private config: OSCConfig;

  constructor(config: OSCConfig) {
    super();
    this.config = config;

    this.udpPort = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: config.inputPort,
      remoteAddress: config.outputIP,
      remotePort: config.outputPort,
      metadata: true,
    });

    this.udpPort.on('ready', () => {
      console.log(`OSC listening on port ${config.inputPort}`);
      console.log(`OSC sending to ${config.outputIP}:${config.outputPort}`);
    });

    this.udpPort.on('message', (oscMsg: osc.OscMessage) => {
      const args = oscMsg.args?.map((arg: osc.Argument) => {
        if (typeof arg === 'object' && 'value' in arg) {
          return arg.value;
        }
        return arg;
      }) || [];
      
      this.emit('message', oscMsg.address, args);
    });

    this.udpPort.on('error', (err: Error) => {
      console.error('OSC error:', err);
      this.emit('error', err);
    });

    this.udpPort.open();
  }

  send(address: string, args: (number | string | boolean)[]): void {
    const oscArgs = args.map(arg => {
      if (typeof arg === 'number') {
        return Number.isInteger(arg) ? { type: 'i', value: arg } : { type: 'f', value: arg };
      } else if (typeof arg === 'string') {
        return { type: 's', value: arg };
      } else if (typeof arg === 'boolean') {
        return { type: arg ? 'T' : 'F', value: arg };
      }
      return { type: 'f', value: Number(arg) };
    });

    try {
      this.udpPort.send({
        address,
        args: oscArgs,
      });
    } catch (err) {
      console.error('Failed to send OSC message:', err);
    }
  }

  close(): void {
    try {
      this.udpPort.close();
    } catch (err) {
      console.error('Error closing OSC port:', err);
    }
  }

  getConfig(): OSCConfig {
    return { ...this.config };
  }
}
