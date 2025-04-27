"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const ws = new WebSocket(
      "wss://ws.twelvedata.com/v1/quotes/price?apikey=demo"
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(
        JSON.stringify({
          action: "subscribe",
          params: {
            symbols: "BTC/USD,AAPL,EUR/USD",
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "price") {
        const { symbol, price } = data;
        setPrices((prev) => ({
          ...prev,
          [symbol]: price,
        }));
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
        {Object.entries(prices).map(([symbol, price]) => (
          <li key={symbol} className="border p-4 rounded">
            <strong>{symbol}</strong>: {price}
          </li>
        ))}
      </ul>
    </main>
  );
}
