'use client';

import { useCallback, useRef } from 'react';
import { track } from '@/lib/analytics/client';
import type { EventName, EventProps } from '@/lib/analytics/events';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const fieldName = (el: Field) => el.name || el.id;

/**
 * Focus/blur handlers for a form container: `started` fires on the first focus, `fieldFilled` once per
 * field when it is left with a value. Only field names are recorded, never what the user typed.
 */
export function useFormTracking({ started, fieldFilled, props = {}, stepOf }: {
  /** Omit when 'started' means something other than first focus (e.g. a wizard's first answer). */
  started?: EventName;
  fieldFilled: EventName;
  props?: EventProps;
  stepOf?: (field: string) => string;
}) {
  const startedRef = useRef(false);
  const filled = useRef(new Set<string>());
  const latest = useRef(props);
  latest.current = props;

  const onFocus = useCallback((e: React.FocusEvent) => {
    const name = fieldName(e.target as Field);
    if (!started || startedRef.current || !name) return;
    startedRef.current = true;
    track(started, { ...latest.current, first_field: name });
  }, [started]);

  const onBlur = useCallback((e: React.FocusEvent) => {
    const el = e.target as Field;
    const name = fieldName(el);
    if (!name || filled.current.has(name)) return;
    const hasValue = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : !!el.value?.trim();
    if (!hasValue) return;
    filled.current.add(name);
    track(fieldFilled, { ...latest.current, field_name: name, ...(stepOf && { step: stepOf(name) }), fields_completed: filled.current.size });
  }, [fieldFilled, stepOf]);

  /** Fields touched so far, for drop-off analysis on submit failures. */
  const fieldsCompleted = () => filled.current.size;

  return { onFocus, onBlur, fieldsCompleted };
}

/** Flattens react-hook-form's nested errors object to dotted field names. */
export function errorFields(errors: object, prefix = ''): string[] {
  return Object.entries(errors).flatMap(([k, v]) =>
    v && typeof v === 'object' && !('message' in v && typeof v.message === 'string') ? errorFields(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}
