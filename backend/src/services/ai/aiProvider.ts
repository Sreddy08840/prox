export interface AIAnalysisResult {
  budget: number | null;
  preferredUnit: string | null;
  timeline: string | null;
  financingStatus: string | null;
  intent: string | null;
  leadScore: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  rawResponse?: string;
}

export interface AIProvider {
  analyzeConversation(transcript: string, promptTemplate: string): Promise<AIAnalysisResult>;
  summarizeConversation(transcript: string, promptTemplate: string): Promise<string>;
}
