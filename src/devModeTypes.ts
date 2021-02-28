import { LogLevel } from './module/constants';

type DebugFlagType = 'boolean' | 'level';
type DebugFlagValue = { kind: 'boolean'; value: boolean } | { kind: 'level'; value: LogLevel };

type ExcludeKindKey<K> = K extends 'kind' ? never : K;
type ExcludeKindField<A> = { [K in ExcludeKindKey<keyof A>]: A[K] };
type ExtractValue<A, T> = A extends { kind: T } ? ExcludeKindField<A> : never;

export interface ModuleSpecificDebugFlag<T extends DebugFlagType> {
  packageName: string;
  kind: T;
  value: ExtractValue<DebugFlagValue, T>['value'];
}
