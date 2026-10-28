'use server';
/**
 * @fileOverview Extracts transactions from a PDF bank statement using a multimodal LLM.
 *
 * - extractTransactionsFromPdf - A function that handles the PDF transaction extraction process.
 * - ExtractTransactionsFromPdfInput - The input type for the extractTransactionsFromPdf function.
 * - ExtractTransactionsFromPdfOutput - The return type for the extractTransactionsFromPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTransactionsFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF bank statement, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTransactionsFromPdfInput = z.infer<typeof ExtractTransactionsFromPdfInputSchema>;

const ExtractTransactionsFromPdfOutputSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().describe('The date of the transaction.'),
      description: z.string().describe('The description of the transaction.'),
      amount: z.number().describe('The amount of the transaction.'),
      type: z.enum(['credit', 'debit']).describe('The type of transaction.'),
    })
  ).describe('An array of extracted transactions.'),
});
export type ExtractTransactionsFromPdfOutput = z.infer<typeof ExtractTransactionsFromPdfOutputSchema>;

export async function extractTransactionsFromPdf(input: ExtractTransactionsFromPdfInput): Promise<ExtractTransactionsFromPdfOutput> {
  return extractTransactionsFromPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionsFromPdfPrompt',
  input: {schema: ExtractTransactionsFromPdfInputSchema},
  output: {schema: ExtractTransactionsFromPdfOutputSchema},
  prompt: `You are an expert financial analyst. Your task is to extract transaction details from a bank statement provided as a PDF.

You will receive the bank statement as a PDF data URI. Extract all transactions from the PDF, including the date, description, amount, and type (credit or debit).

Return the extracted transactions as a complete and valid JSON array. It is crucial that the JSON is well-formed and not truncated. Make sure every transaction object in the array has all the required fields: date, description, amount, and type. The 'type' must be either 'credit' or 'debit'.

Bank Statement PDF: {{media url=pdfDataUri}}`,
});

const extractTransactionsFromPdfFlow = ai.defineFlow(
  {
    name: 'extractTransactionsFromPdfFlow',
    inputSchema: ExtractTransactionsFromPdfInputSchema,
    outputSchema: ExtractTransactionsFromPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
