export interface Account { k: string; n: string; mo: number; tax: string }
/** [ticker, capital $, months held] */
export type Holding = [string, number, number];
/** [ticker, weight %] */
export type Target = [string, number];

export interface Profile {
  label: string;
  accounts: Account[];
  holdings: Record<string, Holding[]>;
  recommended: Record<string, Target[]>;
  /** Account-level reminders that are not derived from holdings: [title, detail] */
  notes: [string, string][];
  bondBand: string;
}
