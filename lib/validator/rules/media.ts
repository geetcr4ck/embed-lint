import { MAX_URL_LENGTH } from '../../schema/constants';
import { detectFormat, type MediaKind } from '../../media/detectFormat';
import type { Rule, ValidationIssue } from './types';
import { findExtraKeys, walkComponents } from './walk';

// Ref: §18 - media is only { url }; gallery items may add description/spoiler.
export const mediaShapeRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  const push = (path: (string | number)[], key: string): void => {
    issues.push({
      severity: 'error',
      path: [...path, key],
      code: 'MEDIA_SHAPE',
      message: `Key "${key}" is not allowed on media.`,
      hint: 'Remove this key; media is only { url }, description/spoiler are gallery-item only.',
    });
  };
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type === 11) {
      for (const key of findExtraKeys(Object.keys(node.media), ['url'])) {
        push([...path, 'media'], key);
      }
    } else if (node.type === 12) {
      node.items.forEach((item, index) => {
        for (const key of findExtraKeys(Object.keys(item), ['media', 'description', 'spoiler'])) {
          push([...path, 'items', index], key);
        }
        for (const key of findExtraKeys(Object.keys(item.media), ['url'])) {
          push([...path, 'items', index, 'media'], key);
        }
      });
    }
  }
  return issues;
};

// Ref: §18 - media/button URLs are at most 2,048 characters.
export const mediaUrlLengthRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  const check = (url: string, path: (string | number)[]): void => {
    if (url.length > MAX_URL_LENGTH) {
      issues.push({
        severity: 'error',
        path,
        code: 'MEDIA_URL_LENGTH',
        message: `URL exceeds 2,048 characters (${url.length}).`,
        hint: 'Shorten the URL or use a short link.',
      });
    }
  };
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type === 2) {
      check(node.url, [...path, 'url']);
    } else if (node.type === 11) {
      check(node.media.url, [...path, 'media', 'url']);
    } else if (node.type === 12) {
      node.items.forEach((item, index) => {
        check(item.media.url, [...path, 'items', index, 'media', 'url']);
      });
    }
  }
  return issues;
};

// Ref: §18 - format check via extension whitelist (no fetching).
export const mediaFormatRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  const check = (url: string, kind: MediaKind, path: (string | number)[]): void => {
    if (detectFormat(url, kind) !== undefined) {
      return;
    }
    const expected =
      kind === 'gallery' ? 'png, gif, jpeg, webp, avif, mp4, mov, webm' : 'png, gif, jpeg, webp, avif';
    issues.push({
      severity: 'error',
      path,
      code: 'MEDIA_FORMAT',
      message: `Unsupported media format for ${kind}: "${url}".`,
      hint: `Use one of these formats: ${expected}.`,
    });
  };
  for (const { node, path } of walkComponents(payload.component)) {
    if (node.type === 11) {
      check(node.media.url, 'thumbnail', [...path, 'media', 'url']);
    } else if (node.type === 12) {
      node.items.forEach((item, index) => {
        check(item.media.url, 'gallery', [...path, 'items', index, 'media', 'url']);
      });
    }
  }
  return issues;
};
