"use client";

import { useEffect, useRef, useState } from "react";

const SYMBOLS = ["BTC/USD"];

type PriceState = {
  price: string;
  change: "up" | "down" | "none";
  flash: boolean;
};

export default function HomePage() {
  const [prices, setPrices] = useState<Record<string, PriceState>>(() =>
    SYMBOLS.reduce((acc, symbol) => {
      acc[symbol] = { price: "Loading...", change: "none", flash: false };
      return acc;
    }, {} as Record<string, PriceState>)
  );

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

  useEffect(() => {
    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Live Market Prices</h1>

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
    </main>
  );
}
