import { type ZodError, type ZodIssue } from 'zod';
import { DiscordPayloadSchema } from '../schema/payload';
import { byteSize } from './byteSize';
import { allRules } from './rules';
import { maxBytesIssue } from './rules/limits';
import {
  countComponents,
  countMediaUrls,
  looseCountComponents,
  looseCountMediaUrls,
} from './rules/walk';
import type { JsonPath, ValidationIssue, ValidationResult } from './rules/types';

// Validator entry point: pure function, no React/DOM, no `any`, no `as`.
// - Schema-valid payloads go through the 12 semantic rules.
// - Schema-invalid payloads get Zod errors mapped to the closest rule code
//   (needed because the strict schema rejects inputs like style != 5 before
//   the semantic rules ever see them), plus a MAX_BYTES check on the raw string.
export function validate(payload: unknown): ValidationResult {
  const raw = JSON.stringify(payload) ?? '';
  const rawBytes = byteSize(raw);
  const parsed = DiscordPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const issues = dedupeIssues([...mapZodError(parsed.error), ...maxBytesIssue(rawBytes)]);
    return {
      ok: !issues.some((issue) => issue.severity === 'error'),
      issues,
      stats: {
        componentCount: looseCountComponents(payload),
        rawBytes,
        totalMediaUrls: looseCountMediaUrls(payload),
      },
    };
  }
  const issues = dedupeIssues(allRules.flatMap((rule) => rule(parsed.data)));
  return {
    ok: !issues.some((issue) => issue.severity === 'error'),
    issues,
    stats: {
      componentCount: countComponents(parsed.data.component),
      rawBytes,
      totalMediaUrls: countMediaUrls(parsed.data.component),
    },
  };
}

export type {
  Rule,
  ValidationIssue,
  ValidationResult,
  ValidationStats,
} from './rules/types';

// --- ZodIssue to ValidationIssue mapping ---

function dedupeIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}|${JSON.stringify(issue.path)}|${issue.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function mapZodError(error: ZodError): ValidationIssue[] {
  return error.issues.flatMap((issue) => mapIssueAt(issue, []));
}

function mapIssueAt(issue: ZodIssue, basePath: JsonPath): ValidationIssue[] {
  if (issue.code === 'invalid_union') {
    return mapUnionIssue([...basePath, ...issue.path], issue.unionErrors);
  }
  return [toValidationIssue(issue, [...basePath, ...issue.path])];
}

// invalid_union descent (produced by discriminatedUnion in the schema):
// pick the branch with a matching discriminator (no root 'type'
// literal mismatch), then the one with the fewest issues.
function mapUnionIssue(fullPath: JsonPath, unionErrors: ZodError[]): ValidationIssue[] {
  const candidates = unionErrors.filter((error) => error.issues.length > 0);
  const matching = candidates.filter(
    (error) =>
      !error.issues.some(
        (inner) =>
          inner.code === 'invalid_literal' && inner.path.length === 1 && inner.path[0] === 'type',
      ),
  );
  const pool = matching.length > 0 ? matching : candidates;
  const best = [...pool].sort((a, b) => a.issues.length - b.issues.length)[0];
  if (best === undefined) {
    return [contextFallback(fullPath)];
  }
  return best.issues.flatMap((inner) => mapIssueAt(inner, fullPath));
}

function toValidationIssue(issue: ZodIssue, fullPath: JsonPath): ValidationIssue {
  const last: string | number | undefined = fullPath[fullPath.length - 1];

  if (issue.code === 'unrecognized_keys') {
    const keys = issue.keys.join('", "');
    if (fullPath.includes('media') || fullPath.includes('items')) {
      return {
        severity: 'error',
        path: fullPath,
        code: 'MEDIA_SHAPE',
        message: `Key "${keys}" is not allowed on media.`,
        hint: 'Remove this key; media is only { url }, description/spoiler are gallery-item only.',
      };
    }
    return {
      severity: 'error',
      path: fullPath,
      code: 'BUTTON_KEYS',
        message: `Key "${keys}" is not allowed on Button.`,
        hint: 'Remove this key; only type, url, style, label, emoji, disabled are valid.',
    };
  }

  if (issue.code === 'invalid_literal' && last === 'style') {
    return {
      severity: 'error',
      path: fullPath,
      code: 'BUTTON_STYLE',
      message: 'Button must use style 5 (link).',
      hint: 'Change "style" to 5.',
    };
  }

  if (issue.code === 'invalid_literal' && last === 'type') {
    if (fullPath.length === 2 && fullPath[0] === 'component') {
      return {
        severity: 'error',
        path: fullPath,
        code: 'ROOT_SHAPE',
        message: 'Root "component" must be a Container with type 17.',
        hint: 'Change "component.type" to 17.',
      };
    }
    if (fullPath.includes('accessory')) {
      return {
        severity: 'error',
        path: fullPath,
        code: 'SECTION_SHAPE',
        message: 'Section accessory must be a Thumbnail (11) or Button (2).',
        hint: 'Replace the accessory with a Thumbnail or link Button.',
      };
    }
    return {
      severity: 'error',
      path: fullPath,
      code: 'CONTAINER_CHILD_TYPE',
      message: 'This component type is not allowed in this position.',
      hint: 'Use types 1, 2, 9, 10, 11, 12, 14, 17 following the nesting rules.',
    };
  }

  if (issue.code === 'too_small' || issue.code === 'too_big') {
    if (last === 'url') {
      return {
        severity: 'error',
        path: fullPath,
        code: 'MEDIA_URL_LENGTH',
        message: 'URL exceeds 2,048 characters.',
        hint: 'Shorten the URL or use a short link.',
      };
    }
    // The only 'components' array with min/max in the schema belongs to Section.
    if (last === 'components') {
      return {
        severity: 'error',
        path: fullPath,
        code: 'SECTION_SHAPE',
        message: 'Section must contain 1-3 Text Displays.',
        hint: 'Add or remove Text Displays to reach 1-3.',
      };
    }
  }

  if (last === 'accent_color') {
    return {
      severity: 'error',
      path: fullPath,
      code: 'ACCENT_COLOR',
      message: 'accent_color must be an integer from 0 to 16777215.',
      hint: 'Use a 6-digit hex value, e.g. "#5865F2".',
    };
  }

  return contextFallback(fullPath);
}

// Closest-code fallback based on path context; detail comes from Zod.
function contextFallback(fullPath: JsonPath): ValidationIssue {
  if (
    fullPath.includes('media') ||
    fullPath.includes('items') ||
    fullPath.includes('emoji') ||
    fullPath.includes('label')
  ) {
    const isMedia = fullPath.includes('media') || fullPath.includes('items');
    return {
      severity: 'error',
      path: fullPath,
      code: isMedia ? 'MEDIA_SHAPE' : 'BUTTON_KEYS',
      message: 'Invalid field shape.',
      hint: isMedia
        ? 'Double-check the media shape: only { url } (plus description/spoiler for gallery items).'
        : 'Double-check the Button fields: only type, url, style, label, emoji, disabled.',
    };
  }
  if (fullPath.includes('accessory')) {
    return {
      severity: 'error',
      path: fullPath,
      code: 'SECTION_SHAPE',
      message: 'Invalid Section accessory shape.',
      hint: 'The accessory must be a valid Thumbnail (11) or Button (2).',
    };
  }
  if (fullPath.includes('components')) {
    return {
      severity: 'error',
      path: fullPath,
      code: 'CONTAINER_CHILD_TYPE',
      message: 'Invalid child component shape.',
      hint: 'Use types 1, 2, 9, 10, 11, 12, 14, 17 following the nesting rules.',
    };
  }
  return {
    severity: 'error',
    path: fullPath,
    code: 'ROOT_SHAPE',
    message: 'Invalid payload shape.',
    hint: 'Make sure the root is { component: { type: 17, components: [...] } }.',
  };
}
