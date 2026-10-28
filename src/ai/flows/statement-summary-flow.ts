'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing bank statements.
 *
 * - statementSummaryFlow - A function that takes bank statement text as input and returns a summary of the transactions.
 * - StatementSummaryInput - The input type for the statementSummaryFlow function.
 * - StatementSummaryOutput - The return type for the statementSummaryFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StatementSummaryInputSchema = z.object({
  statementText: z
    .string()
    .describe('The text content of the bank statement to be summarized.'),
});
export type StatementSummaryInput = z.infer<typeof StatementSummaryInputSchema>;

const StatementSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the transactions in the bank statement.'),
});
export type StatementSummaryOutput = z.infer<typeof StatementSummaryOutputSchema>;

export async function summarizeStatement(input: StatementSummaryInput): Promise<StatementSummaryOutput> {
  return statementSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'statementSummaryPrompt',
  input: {schema: StatementSummaryInputSchema},
  output: {schema: StatementSummaryOutputSchema},
  prompt: `You are a financial expert. Please summarize the following bank statement text, highlighting key spending habits and overall financial activity.\n\nBank Statement:\n{{{statementText}}}`,  
});

const statementSummaryFlow = ai.defineFlow(
  {
    name: 'statementSummaryFlow',
    inputSchema: StatementSummaryInputSchema,
    outputSchema: StatementSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
