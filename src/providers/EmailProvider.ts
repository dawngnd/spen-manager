export type TransactionType = 'income' | 'expense' | 'transfer';

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  merchant: string;
  date: Date;
  reference: string;
}

export interface EmailProvider {
  name: string;
  match: (subject: string, from: string) => boolean;
  parse: (body: string, subject: string) => ParsedTransaction | null;
}
