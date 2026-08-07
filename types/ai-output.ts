export interface AiOutput {
  id: string;
  visitId: string;
  summary?: string;
  followUpInstructions?: string;
  errorMessage?: string;
  modelName: string;
  status: 'completed' | 'failed';
  createdAt: string;
}

export type NewAiOutputInput =
  | {
      visitId: string;
      modelName: string;
      status: 'completed';
      summary: string;
      followUpInstructions: string;
    }
  | {
      visitId: string;
      modelName: string;
      status: 'failed';
      errorMessage: string;
    };
