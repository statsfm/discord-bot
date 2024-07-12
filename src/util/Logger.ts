import chalk, { Chalk } from 'chalk';
import dayjs from 'dayjs';
import { injectable } from 'tsyringe';

type LogLevel = 'info' | 'warn' | 'error' | 'log' | 'debug' | 'verbose';

@injectable()
export class Logger {
  constructor(public context?: string) {}

  private readonly colors = new Map<LogLevel, Chalk>([
    ['log', chalk.greenBright.bold],
    ['warn', chalk.yellow.bold],
    ['error', chalk.redBright.bold]
  ]);

  private readonly timeFormat = 'HH:mm:ss';

  private logMessage(
    message: string,
    level: LogLevel,
    context?: string,
    metadata?: Record<string, unknown> | string
  ): void {
    const time: string = dayjs().format(this.timeFormat);
    const levelColorFn = this.colors.get(level) || chalk.gray.bold;
    const contextMessage = context ?? this.context ?? 'Unknown';

    const log = (msg: string): void => {
      console.log(
        [
          chalk.blueBright.bold(time),
          chalk.gray(`(${levelColorFn(level.toUpperCase())})`),
          chalk.gray(contextMessage),
          msg
        ]
          .filter((i) => i)
          .join(' ')
      );
    };

    log(message);

    if (metadata) {
      console.log(metadata);
    }
  }

  log(message: string, context?: string): void {
    this.logMessage(message, 'log', context);
  }

  info(message: string, context?: string): void {
    this.logMessage(message, 'info', context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logMessage(message, 'error', context, trace);
  }

  warn(message: string, context?: string): void {
    this.logMessage(message, 'warn', context);
  }

  debug(message: string, context?: string): void {
    this.logMessage(message, 'debug', context);
  }

  verbose(message: string, context?: string): void {
    this.logMessage(message, 'verbose', context);
  }
}
