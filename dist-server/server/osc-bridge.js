import * as dgram from 'dgram';
import { EventEmitter } from 'events';
// OSC message encoding helpers
function oscString(str) {
    const len = Math.ceil((str.length + 1) / 4) * 4;
    const buf = Buffer.alloc(len);
    buf.write(str, 0, 'ascii');
    return buf;
}
function oscFloat(value) {
    const buf = Buffer.alloc(4);
    buf.writeFloatBE(value, 0);
    return buf;
}
function oscInt(value) {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(value, 0);
    return buf;
}
function buildOscMessage(address, args) {
    const addressBuf = oscString(address);
    // Build type tag string
    let typeTag = ',';
    for (const arg of args) {
        if (typeof arg === 'number') {
            typeTag += Number.isInteger(arg) ? 'i' : 'f';
        }
        else if (typeof arg === 'string') {
            typeTag += 's';
        }
        else if (typeof arg === 'boolean') {
            typeTag += arg ? 'T' : 'F';
        }
    }
    const typeTagBuf = oscString(typeTag);
    // Build arguments
    const argBuffers = [];
    for (const arg of args) {
        if (typeof arg === 'number') {
            argBuffers.push(Number.isInteger(arg) ? oscInt(arg) : oscFloat(arg));
        }
        else if (typeof arg === 'string') {
            argBuffers.push(oscString(arg));
        }
        // Booleans have no data, just the type tag
    }
    return Buffer.concat([addressBuf, typeTagBuf, ...argBuffers]);
}
export class OSCBridge extends EventEmitter {
    sendSocket;
    receiveSocket;
    config;
    constructor(config) {
        super();
        this.config = config;
        // Create separate sockets for sending and receiving
        this.sendSocket = dgram.createSocket('udp4');
        this.receiveSocket = dgram.createSocket('udp4');
        this.receiveSocket.on('message', (msg) => {
            try {
                const parsed = this.parseOscMessage(msg);
                if (parsed) {
                    this.emit('message', parsed.address, parsed.args);
                }
            }
            catch (err) {
                console.error('Failed to parse OSC message:', err);
            }
        });
        this.receiveSocket.on('error', (err) => {
            console.error('OSC receive error:', err);
            this.emit('error', err);
        });
        this.sendSocket.on('error', (err) => {
            console.error('OSC send error:', err);
        });
        this.receiveSocket.bind(config.inputPort, '0.0.0.0', () => {
            console.log(`OSC listening on port ${config.inputPort}`);
            console.log(`OSC sending to ${config.outputIP}:${config.outputPort}`);
        });
    }
    parseOscMessage(buf) {
        let offset = 0;
        // Read address
        let addressEnd = buf.indexOf(0, offset);
        if (addressEnd === -1)
            return null;
        const address = buf.toString('ascii', offset, addressEnd);
        offset = Math.ceil((addressEnd + 1) / 4) * 4;
        // Read type tag
        if (buf[offset] !== 44)
            return null; // ','
        let typeTagEnd = buf.indexOf(0, offset);
        if (typeTagEnd === -1)
            return null;
        const typeTag = buf.toString('ascii', offset + 1, typeTagEnd);
        offset = Math.ceil((typeTagEnd + 1) / 4) * 4;
        // Read arguments
        const args = [];
        for (const type of typeTag) {
            if (type === 'f') {
                args.push(buf.readFloatBE(offset));
                offset += 4;
            }
            else if (type === 'i') {
                args.push(buf.readInt32BE(offset));
                offset += 4;
            }
            else if (type === 's') {
                let strEnd = buf.indexOf(0, offset);
                if (strEnd === -1)
                    strEnd = buf.length;
                args.push(buf.toString('ascii', offset, strEnd));
                offset = Math.ceil((strEnd + 1) / 4) * 4;
            }
        }
        return { address, args };
    }
    send(address, args) {
        try {
            const message = buildOscMessage(address, args);
            console.log(`OSC OUT: ${address}`, args);
            this.sendSocket.send(message, this.config.outputPort, this.config.outputIP, (err) => {
                if (err) {
                    console.error('Failed to send OSC message:', err);
                }
            });
        }
        catch (err) {
            console.error('Failed to build OSC message:', err);
        }
    }
    close() {
        try {
            this.sendSocket.close();
            this.receiveSocket.close();
        }
        catch (err) {
            console.error('Error closing OSC sockets:', err);
        }
    }
    getConfig() {
        return { ...this.config };
    }
}
