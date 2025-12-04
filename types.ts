export enum TearingStyle {
  WILD = 'WILD',
  BURNT = 'BURNT',
  CLAW = 'CLAW',
  MELTING = 'MELTING',
  GEOMETRIC = 'GEOMETRIC',
  PAPER = 'PAPER',
}

export interface GeneratedImageResult {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}
