export const SolverErrorType = {
  FLOATING_NODE: 'FLOATING_NODE',
  KCL_VIOLATION: 'KCL_VIOLATION',
  CONFLICTING_SOURCES: 'CONFLICTING_SOURCES',
} as const;

export type SolverErrorType = typeof SolverErrorType[keyof typeof SolverErrorType];

export class SolverException extends Error {
  readonly type: SolverErrorType;
  readonly componentLabels: string[];

  constructor(type: SolverErrorType, message: string, componentLabels: string[] = []) {
    super(message);
    this.name = 'SolverException';
    this.type = type;
    this.componentLabels = componentLabels;
  }
}
