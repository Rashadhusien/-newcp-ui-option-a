/**
 * Conversion resolver answers (PR #28): a family create (`serviceFamily: 'conversion'`)
 * must carry `conversionSoftware`, `conversionSegmentationType` and `conversionArchScope`,
 * from which the backend picks the concrete sellable item. Added at submit time only; the
 * Conversion form itself is unchanged.
 *
 * Mapped only what the backend has proven. `conversionSoftware` values come from the test
 * server's own 422 (29 Oct 2026): "must be one of: bsb, codx, simplant, implantstudio,
 * realguide"; the form's three Software options match three of them by name.
 * `conversionSegmentationType` and `conversionArchScope` have no published values yet
 * [NEEDS VERIFICATION]: they are not sent, so the server's 422 names what it expects.
 * Sent as `optionCodes` because the values form a closed choice (FormAnswer contract).
 */

import type { FormAnswer } from '@/shared/api';

/** Conversion form `software` option code -> backend `conversionSoftware` value. */
const SOFTWARE_TO_RESOLVER: Readonly<Record<string, string>> = {
  '1': 'simplant',
  '3': 'codx',
  '6': 'bsb',
};

function chosen(answers: readonly FormAnswer[], fieldCode: string): string | undefined {
  return answers.find((answer) => answer.fieldCode === fieldCode)?.optionCodes?.[0];
}

/** The form's answers plus every resolver answer that can be derived; nothing is guessed. */
export function withConversionResolverAnswers(answers: readonly FormAnswer[]): FormAnswer[] {
  const software = chosen(answers, 'software');
  const resolverSoftware = software === undefined ? undefined : SOFTWARE_TO_RESOLVER[software];
  return resolverSoftware === undefined
    ? [...answers]
    : [...answers, { fieldCode: 'conversionSoftware', optionCodes: [resolverSoftware] }];
}
