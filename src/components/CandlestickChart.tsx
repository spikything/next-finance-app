"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

type CandlestickChartProps = {
  candles: Candle[];
};

export default function CandlestickChart({ candles }: CandlestickChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 150;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const candleWidth = 8;

    const x = d3
      .scaleLinear()
      .domain([0, candles.length - 1])
      .range([margin.left, width - margin.right]);

    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(allPrices) || 0, d3.max(allPrices) || 1])
      .range([height - margin.bottom, margin.top]);

    const group = svg.append("g");

    candles.forEach((candle, i) => {
      const color = candle.close > candle.open ? "#22c55e" : "#ef4444"; // green/red

      const bodyHeight = Math.abs(y(candle.open) - y(candle.close)) || 1;

      // wick
      group
        .append("line")
        .attr("x1", x(i))
        .attr("x2", x(i))
        .attr("y1", y(candle.high))
        .attr("y2", y(candle.low))
        .attr("stroke", color)
        .attr("stroke-width", 1);

      // body
      group
        .append("rect")
        .attr("x", x(i) - candleWidth / 2)
        .attr("y", y(Math.max(candle.open, candle.close)))
        .attr("width", candleWidth)
        .attr("height", bodyHeight)
        .attr("fill", color);
    });
  }, [candles]);

  return <svg ref={ref} width={400} height={150} />;
}
