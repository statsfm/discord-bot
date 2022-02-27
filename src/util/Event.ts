export interface IEvent {
  name: string;
  event: string;
  disabled?: boolean;
  execute(...args: any): unknown | Promise<unknown>;
}
