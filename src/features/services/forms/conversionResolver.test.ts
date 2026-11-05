import { describe, expect, it } from 'vitest';
import { withConversionResolverAnswers } from './conversionResolver';

describe('withConversionResolverAnswers (PR #28 resolver fields)', () => {
  it.each([
    ['1', 'simplant'],
    ['3', 'codx'],
    ['6', 'bsb'],
  ])('maps software %s to conversionSoftware %s and keeps the form answers', (software, resolver) => {
    const answers = [{ fieldCode: 'software', optionCodes: [software] }, { fieldCode: 'maxilla', optionCodes: ['21'] }];
    expect(withConversionResolverAnswers(answers)).toEqual([
      ...answers,
      { fieldCode: 'conversionSoftware', optionCodes: [resolver] },
    ]);
  });

  it('adds nothing it cannot derive: no unknown software, no segmentation or arch scope', () => {
    const answers = [
      { fieldCode: 'software', optionCodes: ['99'] },
      { fieldCode: 'typeMaxilla', optionCodes: ['1'] },
      { fieldCode: 'maxilla', optionCodes: ['21'] },
    ];
    const result = withConversionResolverAnswers(answers);
    expect(result).toEqual(answers);
    expect(result.map((answer) => answer.fieldCode)).not.toEqual(
      expect.arrayContaining(['conversionSegmentationType', 'conversionArchScope']),
    );
  });
});
