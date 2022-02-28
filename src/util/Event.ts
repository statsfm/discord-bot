export interface IEvent {
  name: string;
  disabled?: boolean;
  execute(...args: any): unknown | Promise<unknown>;
}
