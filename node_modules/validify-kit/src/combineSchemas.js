'use strict';

/**
 * combineSchemas(...schemas) → object
 *
 * Merges two or more schemas into one. Later schemas win on duplicate keys.
 * Original schema objects are never mutated.
 *
 * @param {...object} schemas
 * @returns {object} Combined schema.
 */
function combineSchemas(...schemas) {
  const result = {};
  for (const schema of schemas) {
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      Object.assign(result, schema);
    }
  }
  return result;
}

module.exports = { combineSchemas };
