import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  hasError = false,
  autoFocus = true
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const cleanDigit = rawVal.replace(/\D/g, "").slice(-1);

    const nextArr = [...digits];
    nextArr[index] = cleanDigit;
    const nextVal = nextArr.join("");
    onChange(nextVal);

    if (cleanDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const nextArr = [...digits];
        nextArr[index - 1] = "";
        onChange(nextArr.join(""));
      } else {
        const nextArr = [...digits];
        nextArr[index] = "";
        onChange(nextArr.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const targetIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
      {digits.map((digit, index) => {
        const isFilled = Boolean(digit);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-2xl border transition-all outline-none ${
              hasError
                ? "border-red-500 bg-red-50/40 text-red-700 focus:ring-2 focus:ring-red-300"
                : isFilled
                ? "border-[#FF5A00] bg-orange-50/20 text-[#0B1020] shadow-xs"
                : "border-[#0B1020]/15 bg-white text-[#0B1020] hover:border-[#0B1020]/30 focus:border-[#FF5A00] focus:ring-2 focus:ring-[#FF5A00]/20"
            } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
