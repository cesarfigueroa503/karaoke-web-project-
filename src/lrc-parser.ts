export interface LrcLine {
  timestamp: number
  text: string
}

export interface LrcMetadata {
  title: string
  artist: string
}

export class LrcParser {
  private regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/

  extractMetadata(content: string): LrcMetadata {
    const title = content.match(/^\[ti:(.*)\]$/m)
    const artist = content.match(/^\[ar:(.*)\]$/m)
    return {
      title: title?.[1]?.trim() || '',
      artist: artist?.[1]?.trim() || '',
    }
  }

  parse(content: string): LrcLine[] {
    const lines = content.split(/\r?\n|\r/)
    const result: LrcLine[] = []

    for (const line of lines) {
      const match = line.match(this.regex)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10)
        const text = match[4].trim()

        const timestamp = minutes * 60 + seconds + milliseconds / 1000
        result.push({ timestamp, text })
      }
    }

    return result.sort((a, b) => a.timestamp - b.timestamp)
  }
}
