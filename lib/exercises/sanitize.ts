import type {
  Exercise,
  ClientExercise,
  ClientExerciseVariation,
} from "./types";

/**
 * Strips server-only fields from an Exercise before sending to the client.
 * Removes expectedSql and variation.expectedSql.
 *
 * Always use this instead of manual destructuring to avoid accidentally leaking
 * the expected SQL answer to the browser.
 */
export function toClientExercise(exercise: Exercise): ClientExercise {
  const { expectedSql: _expected, variation, ...rest } = exercise;

  let clientVariation: ClientExerciseVariation | undefined;
  if (variation) {
    const { expectedSql: _varExpected, ...varRest } = variation;
    clientVariation = varRest;
  }

  return {
    ...rest,
    ...(clientVariation !== undefined ? { variation: clientVariation } : {}),
  };
}
