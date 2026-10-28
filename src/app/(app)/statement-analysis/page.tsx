'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { summarizeStatement } from '@/ai/flows/statement-summary-flow';
import { Loader2 } from 'lucide-react';

export default function StatementAnalysisPage() {
  const [statementText, setStatementText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!statementText.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please paste your statement text.' });
      return;
    }
    setIsLoading(true);
    setSummary('');
    try {
      const result = await summarizeStatement({ statementText });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error summarizing statement:', error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not summarize the statement.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Statement Analysis</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Analyze Your Finances</CardTitle>
          <CardDescription>Paste your bank statement text below to get an AI-powered summary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your bank statement text here..."
            value={statementText}
            onChange={(e) => setStatementText(e.target.value)}
            rows={10}
            disabled={isLoading}
          />
          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Analyze Statement
          </Button>
        </CardContent>
      </Card>
      
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
