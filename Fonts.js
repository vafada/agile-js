class Fonts {

    constructor(rawData) {
        this.startPosition = 0;
        this.buffer = rawData;
        this.end = this.buffer.byteLength;
        this.length = this.end - this.startPosition;
        this.position = 0;
        this.number = 0;

    }

    readUint8() {
        return this.buffer[this.startPosition + this.position++];
    }

    readUint16(littleEndian = true) {
        const b1 = this.buffer[this.startPosition + this.position++];
        const b2 = this.buffer[this.startPosition + this.position++];
        if (littleEndian) {
            return (b2 << 8) + b1;
        }
        return (b1 << 8) + b2;
    }

    readInt16(littleEndian= true) {
        const b1 = this.buffer[this.startPosition + this.position++];
        const b2 = this.buffer[this.startPosition + this.position++];
        if (littleEndian) {
            return ((((b2 << 8) | b1) << 16) >> 16);
        }
        return ((((b1 << 8) | b2) << 16) >> 16);
    }
}