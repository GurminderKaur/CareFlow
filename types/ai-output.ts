export interface AiOutput {
  id: string;
  visitId: string;
  summary: string;
  followUpInstructions: string;
  modelName: string;
  status: 'completed' | 'failed';
  createdAt: string;
}

export interface NewAiOutputInput {
  visitId: string;
  summary: string;
  followUpInstructions: string;
  modelName: string;
  status: AiOutput['status'];
}
