import { LogLevel } from './module/constants';

export type DebugFlagType = 'boolean' | 'level';

type DebugFlagValues = {
  boolean: boolean;
  level: LogLevel;
};
export interface PackageSpecificDebugFlag<T extends DebugFlagType> {
  packageName: string;
  kind: T;
  value: DebugFlagValues[T];
}

export interface DebugFlagSetting<T extends DebugFlagType> {
  choices?: Record<string, string>;
  hint?: string;
  name?: string;
  scope: string;
  type?: T;
  key?: string;
  isSelect?: boolean;
  isCheckbox?: boolean;
  value?: DebugFlagValues[T];
}
