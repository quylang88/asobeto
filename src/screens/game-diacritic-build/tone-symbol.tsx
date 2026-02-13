interface ToneSymbolProps {
  symbol: string;
  className?: string;
}

const ASCII_TONE_MAP: Record<string, string> = {
  "`": "̀",
  "´": "́",
  "?": "̉",
  "~": "̃",
  ".": "̣",
};

function normalizeToneSymbol(symbol: string): string {
  if (!symbol) return symbol;
  if (symbol.startsWith("◌")) {
    return symbol.slice(1);
  }
  return ASCII_TONE_MAP[symbol] ?? symbol;
}

export function ToneSymbol({ symbol, className }: ToneSymbolProps) {
  const toneMark = normalizeToneSymbol(symbol);
  const isTone = toneMark.length === 1 && toneMark !== symbol;

  if (!isTone) {
    return <span className={className}>{toneMark}</span>;
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center leading-none ${
        className ?? ""
      }`}
      style={{ width: "1.1em", height: "1em" }}
    >
      <span className="select-none opacity-0">o</span>
      <span
        className="absolute inset-0 flex items-center justify-center font-black leading-none"
        style={{
          fontFamily: "Noto Sans, Arial, sans-serif",
          transform:
            toneMark === "̣" ? "translateY(0.24em)" : "translateY(-0.08em)",
        }}
      >
        {toneMark}
      </span>
    </span>
  );
}
