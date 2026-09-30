type TradingViewProps = {
  symbol: string;
};

export function TradingView({ symbol }: TradingViewProps) {
  const params = new URLSearchParams({
    symbol,
    interval: "1",
    theme: "dark",
    style: "1",
    timezone: "Etc/UTC",
    withdateranges: "1",
    hidesidetoolbar: "0",
    symboledit: "0",
    saveimage: "0",
    toolbarbg: "0b0f16",
    allow_symbol_change: "0"
  });

  return (
    <div className="h-[420px] min-h-[360px] min-w-0 overflow-hidden border border-rh-line bg-rh-panel md:h-[640px]">
      <iframe
        key={symbol}
        title={`${symbol} market chart`}
        src={`https://s.tradingview.com/widgetembed/?${params.toString()}`}
        className="h-full w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
