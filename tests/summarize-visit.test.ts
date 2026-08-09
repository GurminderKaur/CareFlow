import { describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { summarizeVisit } from '../server/ai/summarize-visit';

function mockClient(create: (...args: unknown[]) => unknown) {
  return { messages: { create } } as unknown as Anthropic;
}

describe('summarizeVisit', () => {
  it('rejects empty notes without calling the AI provider', async () => {
    const create = vi.fn();
    const client = mockClient(create);

    await expect(summarizeVisit(client, '   ')).rejects.toThrow('Visit notes are required');
    expect(create).not.toHaveBeenCalled();
  });

  it('returns the summary and follow-up instructions on a valid tool response', async () => {
    const create = vi.fn().mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'record_visit_summary',
          input: { summary: 'Patient is recovering well.', followUpInstructions: 'Return in two weeks.' },
        },
      ],
    });
    const client = mockClient(create);

    const result = await summarizeVisit(client, 'Patient reports feeling better.');

    expect(result).toEqual({
      summary: 'Patient is recovering well.',
      followUpInstructions: 'Return in two weeks.',
    });
  });

  it('throws when no tool_use block is returned', async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'I cannot help with that.' }],
    });
    const client = mockClient(create);

    await expect(summarizeVisit(client, 'Some notes')).rejects.toThrow(
      'The AI provider did not return a usable summary'
    );
  });

  it('throws when the tool response is missing required fields', async () => {
    const create = vi.fn().mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'record_visit_summary',
          input: { summary: 'Patient is recovering well.' },
        },
      ],
    });
    const client = mockClient(create);

    await expect(summarizeVisit(client, 'Some notes')).rejects.toThrow(
      'The AI provider returned an unusable response'
    );
  });

  it('propagates an error from the AI provider', async () => {
    const create = vi.fn().mockRejectedValue(new Error('rate limit exceeded'));
    const client = mockClient(create);

    await expect(summarizeVisit(client, 'Some notes')).rejects.toThrow('rate limit exceeded');
  });
});
