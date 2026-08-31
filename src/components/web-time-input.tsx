import { createElement } from 'react';

export function WebTimeInput({
  value,
  onChange,
  color,
  background,
  border,
}: {
  value: string;
  onChange: (value: string) => void;
  color: string;
  background: string;
  border: string;
}) {
  return createElement('input', {
    type: 'time',
    value,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    style: {
      fontSize: 18,
      padding: 8,
      borderRadius: 12,
      border: `1px solid ${border}`,
      background,
      color,
    },
  });
}
