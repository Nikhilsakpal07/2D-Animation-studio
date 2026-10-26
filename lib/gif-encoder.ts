/**
 * High-performance client-side GIF89a encoder for locked 960 × 540 animation frames.
 * Uses 8-bit color cube quantization (3-3-2 RGB) for near-instant index mapping
 * and standard LZW variable-length bit stream compression without external dependencies.
 */

export class GifEncoder {
  private width: number
  private height: number
  private delay: number // In 1/100s (e.g., 4 for ~24 FPS, 5 for 20 FPS)
  private palette: Uint8Array
  private buffer: number[] = []

  constructor(width: number, height: number, delayHundredths: number = 4) {
    this.width = width
    this.height = height
    this.delay = delayHundredths

    // Precompute 256-color palette (3 bits Red, 3 bits Green, 2 bits Blue)
    this.palette = new Uint8Array(256 * 3)
    for (let i = 0; i < 256; i++) {
      const r = (i >> 5) & 0x07
      const g = (i >> 2) & 0x07
      const b = i & 0x03

      this.palette[i * 3 + 0] = Math.round((r * 255) / 7)
      this.palette[i * 3 + 1] = Math.round((g * 255) / 7)
      this.palette[i * 3 + 2] = Math.round((b * 255) / 3)
    }

    this.writeHeader()
  }

  private writeHeader() {
    // 1. Signature 'GIF89a'
    this.writeString('GIF89a')

    // 2. Logical Screen Descriptor
    this.writeShort(this.width)
    this.writeShort(this.height)

    // Packed byte: GCT Flag = 1, Color Res = 7 (8 bits), Sort = 0, GCT Size = 7 (256 entries)
    // 1 111 0 111 = 0xF7
    this.buffer.push(0xf7)
    this.buffer.push(0x00) // Background color index
    this.buffer.push(0x00) // Pixel aspect ratio

    // 3. Global Color Table (768 bytes)
    for (let i = 0; i < this.palette.length; i++) {
      this.buffer.push(this.palette[i])
    }

    // 4. Netscape 2.0 Loop Extension for infinite playback
    this.buffer.push(0x21) // Extension introducer
    this.buffer.push(0xff) // Application extension label
    this.buffer.push(0x0b) // Block size (11 bytes)
    this.writeString('NETSCAPE2.0')
    this.buffer.push(0x03) // Sub-block length
    this.buffer.push(0x01) // Sub-block ID
    this.writeShort(0)     // Loop count (0 = infinite)
    this.buffer.push(0x00) // Block terminator
  }

  public addFrame(imageData: ImageData) {
    const data = imageData.data
    const totalPixels = this.width * this.height
    const indexedPixels = new Uint8Array(totalPixels)

    // Fast 3-3-2 quantization
    for (let i = 0, p = 0; p < totalPixels; p++, i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const rIndex = (r >> 5) & 0x07
      const gIndex = (g >> 5) & 0x07
      const bIndex = (b >> 6) & 0x03

      indexedPixels[p] = (rIndex << 5) | (gIndex << 2) | bIndex
    }

    // 1. Graphic Control Extension
    this.buffer.push(0x21) // Introducer
    this.buffer.push(0xf9) // Graphic control label
    this.buffer.push(0x04) // Block size
    this.buffer.push(0x04) // Disposal method: 0x04 = restore to background
    this.writeShort(this.delay) // Frame delay
    this.buffer.push(0x00) // Transparent color index
    this.buffer.push(0x00) // Block terminator

    // 2. Image Descriptor
    this.buffer.push(0x2c) // Image separator
    this.writeShort(0)     // Left position
    this.writeShort(0)     // Top position
    this.writeShort(this.width)
    this.writeShort(this.height)
    this.buffer.push(0x00) // Packed fields (no local color table, not interlaced)

    // 3. LZW Compressed Pixel Data
    this.encodeLZW(indexedPixels, 8)
  }

  private encodeLZW(pixels: Uint8Array, minCodeSize: number) {
    this.buffer.push(minCodeSize)

    const clearCode = 1 << minCodeSize
    const eoiCode = clearCode + 1
    let codeSize = minCodeSize + 1
    let maxCode = (1 << codeSize) - 1
    let nextCode = eoiCode + 1

    const prefixTable = new Int32Array(5003).fill(-1)
    const suffixTable = new Int32Array(5003).fill(-1)
    const codeTable = new Int32Array(5003).fill(-1)

    function hash(prefix: number, suffix: number): number {
      return ((prefix << 8) ^ suffix) % 5003
    }

    function clearTable() {
      prefixTable.fill(-1)
      suffixTable.fill(-1)
      codeTable.fill(-1)
    }

    const outputBytes: number[] = []
    let curAccum = 0
    let curBits = 0

    function writeBits(code: number, size: number) {
      curAccum |= code << curBits
      curBits += size
      while (curBits >= 8) {
        outputBytes.push(curAccum & 0xff)
        curAccum >>= 8
        curBits -= 8
      }
    }

    function flushBits() {
      if (curBits > 0) {
        outputBytes.push(curAccum & 0xff)
        curAccum = 0
        curBits = 0
      }
    }

    writeBits(clearCode, codeSize)

    if (pixels.length === 0) {
      writeBits(eoiCode, codeSize)
      flushBits()
      return
    }

    let prefix = pixels[0]

    for (let i = 1; i < pixels.length; i++) {
      const suffix = pixels[i]
      let h = hash(prefix, suffix)
      let found = false

      while (prefixTable[h] !== -1) {
        if (prefixTable[h] === prefix && suffixTable[h] === suffix) {
          prefix = codeTable[h]
          found = true
          break
        }
        h = (h + 1) % 5003
      }

      if (!found) {
        writeBits(prefix, codeSize)

        if (nextCode <= 4095) {
          prefixTable[h] = prefix
          suffixTable[h] = suffix
          codeTable[h] = nextCode++
          if (nextCode > maxCode && codeSize < 12) {
            codeSize++
            maxCode = (1 << codeSize) - 1
          }
        } else {
          writeBits(clearCode, codeSize)
          clearTable()
          codeSize = minCodeSize + 1
          maxCode = (1 << codeSize) - 1
          nextCode = eoiCode + 1
        }

        prefix = suffix
      }
    }

    writeBits(prefix, codeSize)
    writeBits(eoiCode, codeSize)
    flushBits()

    // Write sub-blocks of at most 254 bytes
    let offset = 0
    while (offset < outputBytes.length) {
      const chunkSize = Math.min(254, outputBytes.length - offset)
      this.buffer.push(chunkSize)
      for (let j = 0; j < chunkSize; j++) {
        this.buffer.push(outputBytes[offset + j])
      }
      offset += chunkSize
    }

    this.buffer.push(0x00) // Block terminator
  }

  public finish(): Blob {
    this.buffer.push(0x3b) // Trailer
    return new Blob([new Uint8Array(this.buffer)], { type: 'image/gif' })
  }

  private writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      this.buffer.push(str.charCodeAt(i))
    }
  }

  private writeShort(val: number) {
    this.buffer.push(val & 0xff)
    this.buffer.push((val >> 8) & 0xff)
  }
}
