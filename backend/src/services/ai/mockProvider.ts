import { AIProvider, AIAnalysisResult } from './aiProvider';

export class MockProvider implements AIProvider {
  async analyzeConversation(transcript: string, _promptTemplate: string): Promise<AIAnalysisResult> {
    // Basic heuristic keyword parser for mock purposes
    const lower = transcript.toLowerCase();

    // 1. Budget extraction
    let budget: number | null = null;
    const normalized = lower.replace(/,/g, '');
    const budgetMatch = normalized.match(/(?:budget|price|around|about|limit)\D*(\d{5,9})/);
    if (budgetMatch && budgetMatch[1]) {
      budget = parseInt(budgetMatch[1]);
    }

    // 2. Preferred Unit extraction
    let preferredUnit: string | null = null;
    if (lower.includes('1 bhk') || lower.includes('one bedroom')) {
      preferredUnit = '1 BHK';
    } else if (lower.includes('2 bhk') || lower.includes('two bedroom')) {
      preferredUnit = '2 BHK';
    } else if (lower.includes('3 bhk') || lower.includes('three bedroom')) {
      preferredUnit = '3 BHK';
    } else if (lower.includes('penthouse') || lower.includes('suite')) {
      preferredUnit = 'Penthouse Suite';
    } else {
      preferredUnit = 'Apartment Layout';
    }

    // 3. Timeline extraction
    let timeline: string | null = 'Immediate';
    if (lower.includes('immediate') || lower.includes('now') || lower.includes('ready')) {
      timeline = 'Immediate';
    } else if (lower.includes('month') || lower.includes('soon')) {
      timeline = '1-3 months';
    } else if (lower.includes('year') || lower.includes('later')) {
      timeline = '6+ months';
    } else {
      timeline = '3-6 months';
    }

    // 4. Financing status
    let financingStatus: string | null = 'Pre-approved';
    if (lower.includes('pre-approved') || lower.includes('approved')) {
      financingStatus = 'Pre-approved';
    } else if (lower.includes('cash') || lower.includes('liquid')) {
      financingStatus = 'Cash buyer';
    } else if (lower.includes('need') || lower.includes('bank') || lower.includes('mortgage')) {
      financingStatus = 'Needs mortgage';
    }

    // 5. Intent
    let intent = 'Customer looking to purchase property.';
    if (lower.includes('investment') || lower.includes('invest')) {
      intent = 'Investment purchase intent.';
    } else if (lower.includes('family') || lower.includes('children') || lower.includes('school')) {
      intent = 'Family home relocation purchase intent.';
    }

    // 6. Lead scoring logic
    let leadScore: 'HOT' | 'WARM' | 'COLD' = 'WARM';
    if (
      (lower.includes('immediate') || lower.includes('now') || lower.includes('ready')) &&
      (lower.includes('pre-approved') || lower.includes('cash'))
    ) {
      leadScore = 'HOT';
    } else if (lower.includes('later') || lower.includes('just looking') || lower.includes('cold')) {
      leadScore = 'COLD';
    }

    // 7. Reasoning
    const reasoning = `AI parsed from conversation heuristics. Determined as ${leadScore} because transcript indicates a timeline of "${timeline}" and financing status of "${financingStatus}".`;

    return {
      budget,
      preferredUnit,
      timeline,
      financingStatus,
      intent,
      leadScore,
      reasoning,
      rawResponse: JSON.stringify({
        budget,
        preferredUnit,
        timeline,
        financingStatus,
        intent,
        leadScore,
        reasoning,
      }),
    };
  }

  async summarizeConversation(transcript: string, _promptTemplate: string): Promise<string> {
    const lines = transcript.split('\n').filter((l) => l.trim().length > 0);
    const count = lines.length;
    return `• Conversation thread consists of ${count} messages between Agent and Customer.
• Discussion centers around property inquiries, pricing plans, and layout requirements.
• Next steps involve continuing follow-up actions and schedules.`;
  }

  async generateDraft(transcript: string, _promptTemplate: string): Promise<string> {
    const lines = transcript.split('\n').filter((l) => l.trim().length > 0);
    const lastLine = lines[lines.length - 1] || '';
    
    return `Hello! We've received your query: "${lastLine.replace(/^(Customer|Agent):\s*/i, '')}". 
I would be happy to share detail plans, pricing sheets, and coordinate a site visit to PropX Towers this Saturday. Let me know if that works for you!`;
  }
}
