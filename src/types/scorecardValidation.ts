export type ValidationSeverity =
  | 'warning'
  | 'error';

export type PlayerValidationIssue = {
  playerId: string;

  holeNumber?: number;

  field:
    | 'gross'
    | 'net'
    | 'points'
    | 'front-nine'
    | 'back-nine'
    | 'total'
    | 'quota';

  expected: number;
  actual: number;

  severity: ValidationSeverity;

  message: string;
};

export type ScorecardValidationResult = {
  passed: boolean;

  issues: PlayerValidationIssue[];
};