import { CORE_SCHEMA, load } from 'js-yaml';

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

const options = { schema: CORE_SCHEMA, json: true } as const;

export function parse(yamlStr: string): YamlValue {
  const lines = yamlStr.split('\n');
  const allCommentOrBlank = lines.every((l) => l.trim() === '' || l.trim().startsWith('#'));
  if (allCommentOrBlank) return null;
  const value = load(yamlStr, options);
  return (value ?? null) as YamlValue;
}
