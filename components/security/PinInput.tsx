import React, { useRef } from 'react';

export type PinInputProps = {
  length: number;
  value: string;
  onChange: (val: string) => void;
  isPassword?: boolean;
};

export function PinInput({ length, value, onChange, isPassword = true }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const val = e.target.value.replace(/\D/g, '');
    let newValue = value.split('');
    newValue[i] = val;
    if (!val) newValue[i] = '';
    const joined = newValue.join('').slice(0, length);
    onChange(joined);
    if (val && i < length - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputRefs.current[i] = el)}
          type={isPassword ? 'password' : 'text'}
          inputMode="numeric"
          maxLength={1}
          className="w-10 h-12 text-center text-xl border rounded-lg mx-1 focus:ring-2 focus:ring-primary bg-background border-muted-foreground"
          value={value[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  );
}
