"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  updates?: number;
};

type CombinedChartProps = {
  candles: Candle[];
  prices: number[];
};

export default function CombinedChart({ candles, prices }: CombinedChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (candles.length === 0 || prices.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const candleWidth = 8;

    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(allPrices) ?? 0, d3.max(allPrices) ?? 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xCandles = d3
      .scaleLinear()
      .domain([0, candles.length - 1])
      .range([margin.left, width - margin.right]);

    const xPrices = d3
      .scaleLinear()
      .domain([0, prices.length - 1])
      .range([margin.left, width - margin.right]);

    const group = svg.append("g");

    // MARK: Draw candlesticks
    candles.forEach((candle, i) => {
      const color = candle.close > candle.open ? "#22c55e" : "#ef4444";
      const bodyHeight = Math.abs(y(candle.open) - y(candle.close)) || 1;

      // wick
      group
        .append("line")
        .attr("x1", xCandles(i))
        .attr("x2", xCandles(i))
        .attr("y1", y(candle.high))
        .attr("y2", y(candle.low))
        .attr("stroke", color)
        .attr("stroke-width", 1);

      // body
      group
        .append("rect")
        .attr("x", xCandles(i) - candleWidth / 2)
        .attr("y", y(Math.max(candle.open, candle.close)))
        .attr("width", candleWidth)
        .attr("height", bodyHeight)
        .attr("fill", color);
    });

    // MARK: Draw line chart
    const line = d3
      .line<number>()
      .x((_, i) => xPrices(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    group
      .append("path")
      .datum(prices)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line(prices) || "");
  }, [candles, prices]);

  return <svg ref={ref} width={500} height={300} />;
}
