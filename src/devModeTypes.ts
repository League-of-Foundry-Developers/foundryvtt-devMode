import { LogLevel } from './module/constants';

type DebugFlagType = 'boolean' | 'level';

type DebugFlagValues = {
  boolean: boolean;
  level: LogLevel;
};
export interface ModuleSpecificDebugFlag<T extends DebugFlagType> {
  packageName: string;
  kind: T;
  value: DebugFlagValues[T];
}
