"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const ws = new WebSocket(
      `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY}`
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
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
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Live Market Prices</h1>
      <ul className="space-y-4">
        {SYMBOLS.map((symbol) => {
          const { price, change, flash } = prices[symbol];

          return (
            <li
              key={symbol}
              className={`border p-4 rounded ${
                flash
                  ? change === "up"
                    ? "bg-green-500"
                    : change === "down"
                    ? "bg-red-500"
                    : ""
                  : "transition-colors duration-700"
              }`}
            >
              <strong>{symbol}</strong>: {price}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
