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
  width: number;
  height: number;
  candles: Candle[];
  prices: number[];
};

export default function CombinedChart({
  width,
  height,
  candles,
  prices,
}: CombinedChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (candles.length === 0 || prices.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 40, bottom: 30, left: 60 };
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

    // --- Draw Gridlines ---

    // Horizontal gridlines (prices)
    const yAxisGrid = d3
      .axisLeft(y)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat(() => ""); // no numbers, just grid lines

    group
      .append("g")
      .attr("class", "y grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisGrid)
      .selectAll("line")
      .attr("stroke", "#e5e7eb") // Tailwind gray-200
      .attr("stroke-dasharray", "2,2");

    // Vertical gridlines (time)
    const xAxisGrid = d3
      .axisBottom(xCandles)
      .ticks(10)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat(() => "");

    group
      .append("g")
      .attr("class", "x grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxisGrid)
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "2,2");

    // --- Draw Candlesticks ---
    candles.forEach((candle, i) => {
      const color = candle.close > candle.open ? "#22c55e" : "#ef4444"; // green/red
      const bodyHeight = Math.abs(y(candle.open) - y(candle.close)) || 1;

      group
        .append("line")
        .attr("x1", xCandles(i))
        .attr("x2", xCandles(i))
        .attr("y1", y(candle.high))
        .attr("y2", y(candle.low))
        .attr("stroke", color)
        .attr("stroke-width", 1);

      group
        .append("rect")
        .attr("x", xCandles(i) - candleWidth / 2)
        .attr("y", y(Math.max(candle.open, candle.close)))
        .attr("width", candleWidth)
        .attr("height", bodyHeight)
        .attr("fill", color);
    });

    // --- Draw Line Chart ---
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

    // --- Draw Y-Axis (Price scale) ---
    const yAxis = d3.axisLeft(y).ticks(6);

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#6b7280") // Tailwind gray-500
      .attr("font-size", "12px");

    // (Optional) X-Axis (Time ticks)
    // Could be timestamps or indices if you want
    // For now, skip real time labels since no real timestamps yet
  }, [candles, prices, height, width]);

  return <svg ref={ref} width={width} height={height} />;
}
