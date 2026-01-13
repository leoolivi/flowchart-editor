export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface EdgeLogEntry {
  timestamp: string;
  eventType: "hover_start" | "hover_end";
  edgeId: string;
  coordinates: { x: number; y: number };
}

class Logger {
  private level: LogLevel;
  private logs: EdgeLogEntry[] = [];

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `[${hours}:${minutes}:${seconds}.${ms}]`;
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`${this.getTimestamp()} [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`${this.getTimestamp()} [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.getTimestamp()} [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.getTimestamp()} [ERROR] ${message}`, ...args);
    }
  }

  logEdgeHover(eventType: "hover_start" | "hover_end", edgeId: string, clientX: number, clientY: number) {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = this.getTimestamp();
    
    const entry: EdgeLogEntry = {
      timestamp,
      eventType,
      edgeId,
      coordinates: { x: clientX, y: clientY }
    };
    
    this.logs.push(entry);
    
    // Always log edge events if they are requested, or filter by level? 
    // Assuming these are important for debugging, we can log them as INFO or separate type.
    // User requested "Visible in the developer console".
    console.log(
      `%c${formattedTimestamp} [EDGE_HOVER] ${eventType} | Edge: ${edgeId} | Pos: (${clientX}, ${clientY})`,
      'color: #bada55' // Add some color to make it distinct
    );
  }

  getLogs() {
    return this.logs;
  }
}

// Default instance
export const logger = new Logger(LogLevel.DEBUG);
