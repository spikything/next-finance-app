"use client";

import { useEffect, useRef, useState } from "react";
import CombinedChart from "@/components/CombinedChart";

const SYMBOLS = ["BTC/USD"];
const CANDLE_SIZE = 30;

type PriceState = {
  price: string;
  change: "up" | "down" | "none";
  flash: boolean;
};

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  updates?: number;
};

export default function HomePage() {
  const [prices, setPrices] = useState<Record<string, PriceState>>(() =>
    SYMBOLS.reduce((acc, symbol) => {
      acc[symbol] = { price: "Loading...", change: "none", flash: false };
      return acc;
    }, {} as Record<string, PriceState>)
  );

  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isWebSocketAlive, setIsWebSocketAlive] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    const ws = new WebSocket(
      `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY}`
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsWebSocketAlive(true);
      ws.send(
        JSON.stringify({
          action: "subscribe",
          params: {
            symbols: SYMBOLS.join(","),
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "price") {
        const { symbol, price } = data;
        const numericPrice = parseFloat(price);

        // MARK: PRICES
        setPrices((prev) => {
          const prevNumeric = parseFloat(prev[symbol]?.price || "0");
          let change: "up" | "down" | "none" = "none";

          if (!isNaN(prevNumeric)) {
            if (numericPrice > prevNumeric) change = "up";
            else if (numericPrice < prevNumeric) change = "down";
          }

          return {
            ...prev,
            [symbol]: {
              price: numericPrice.toFixed(2),
              change,
              flash: change !== "none",
            },
          };
        });

        // MARK: HISTORY
        setPriceHistory((prev) => {
          const updated = [...prev, numericPrice];
          if (updated.length > 50) updated.shift();
          return updated;
        });

        // MARK: CANDLES
        setCandles((prev) => {
          if (prev.length === 0) {
            return [
              {
                open: numericPrice,
                high: numericPrice,
                low: numericPrice,
                close: numericPrice,
                updates: 1,
              },
            ];
          }

          const lastCandle = { ...prev[prev.length - 1] };

          if ((lastCandle.updates || 0) >= CANDLE_SIZE) {
            // Start a new candle
            return [
              ...prev,
              {
                open: numericPrice,
                high: numericPrice,
                low: numericPrice,
                close: numericPrice,
                updates: 1,
              },
            ];
          } else {
            // Update current candle
            lastCandle.high = Math.max(lastCandle.high, numericPrice);
            lastCandle.low = Math.min(lastCandle.low, numericPrice);
            lastCandle.close = numericPrice;
            lastCandle.updates = (lastCandle.updates || 0) + 1;

            return [...prev.slice(0, prev.length - 1), lastCandle];
          }
        });

        // MARK: ANIMATION
        setTimeout(() => {
          setPrices((prev) => ({
            ...prev,
            [symbol]: {
              ...prev[symbol],
              flash: false,
            },
          }));
        }, 500);
      }
    };

    // MARK: ERRORS
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsWebSocketAlive(false);
      ws.close();
    };

    ws.onclose = (event) => {
      console.warn("WebSocket closed", event);
      setIsWebSocketAlive(false);

      setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        connectWebSocket();
      }, 3000);
    };

    wsRef.current = ws;
  };

  // MARK: STARTUP
  useEffect(() => {
    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // connectWebSocket should not be a dependency unless wrapped in a useCallback

  // MARK: JSX
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Realtime Bitcoin price chart using Twelvedata and Next.js
      </h1>

      {!isWebSocketAlive && (
        <div className="mb-6 p-4 bg-yellow-200 border border-yellow-400 text-yellow-800 rounded">
          ⚠️ Live prices unavailable. Reconnecting...
        </div>
      )}

      <ul className="space-y-4">
        {SYMBOLS.map((symbol) => {
          const { price, change, flash } = prices[symbol];

          return (
            <li
              key={symbol}
              className={`border p-4 rounded font-mono text-lg ${
                flash
                  ? change === "up"
                    ? "bg-green-500 text-white"
                    : change === "down"
                    ? "bg-red-500 text-white"
                    : ""
                  : "transition-colors duration-700"
              }`}
            >
              <strong>{symbol}</strong>: {price}{" "}
              {change === "up" ? "↑" : change === "down" ? "↓" : ""}
            </li>
          );
        })}
      </ul>

      <CombinedChart candles={candles} prices={priceHistory} />
    </main>
  );
}
