export interface AnalysisResult {
  understanding: {
    title: string;
    description: string;
    strengths: string[];
  };
  hiddenIssues: Array<{
    issue: string;
    impact: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  futureOutcome: {
    withoutChanges: string;
    withChanges: string;
  };
  recommendations: Array<{
    action: string;
    why: string;
    priority: 'low' | 'medium' | 'high';
    cost: string;
    timeframe: string;
  }>;
}
