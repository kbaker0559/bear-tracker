export const TEE_OPTIONS = [
  'Championship',
  'Black',
  'White',
  'Yellow',
  'Green',
  'Red',
] as const;

export type Tee = typeof TEE_OPTIONS[number];