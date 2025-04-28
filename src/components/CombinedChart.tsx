"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function CombinedChart({
  width,
  height,
  candles,
  prices,
}: CombinedChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (candles.length === 0 || prices.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    setHoverIndex(null);

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

    const group = svg.append("g");

    // MARK: Gridlines

    // Horizontal gridlines (prices)
    const yAxisGrid = d3
      .axisLeft(y)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat(() => "");

    group
      .append("g")
      .attr("class", "y grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisGrid)
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
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

    // MARK: Candlesticks
    candles.forEach((candle, i) => {
      const color = candle.close > candle.open ? "#22c55e" : "#ef4444";
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

    // MARK: Hover overlay
    svg
      .append("rect")
      .attr("fill", "transparent")
      .attr("width", width)
      .attr("height", height)
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xCandles.invert(mouseX);
        const index = Math.round(x0);

        if (index >= 0 && index < candles.length) {
          setHoverIndex(index);
        } else {
          setHoverIndex(null);
        }
      })
      .on("mouseleave", function () {
        setHoverIndex(null);
      });

    // MARK: Line
    const closePrices = candles.map((c) => c.close);

    const line = d3
      .line<number>()
      .x((_, i) => xCandles(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    group
      .append("path")
      .datum(closePrices)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line(closePrices) || "");

    // --- Draw Y-Axis (Price scale) ---
    const yAxis = d3.axisLeft(y).ticks(6);

    if (hoverIndex !== null && candles[hoverIndex]) {
      const candle = candles[hoverIndex];

      // Draw vertical line
      group
        .append("line")
        .attr("x1", xCandles(hoverIndex))
        .attr("x2", xCandles(hoverIndex))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#9ca3af")
        .attr("stroke-dasharray", "2,2")
        .attr("stroke-width", 1);

      // MARK: Tooltip
      group
        .append("text")
        .attr("x", xCandles(hoverIndex) + 8)
        .attr("y", margin.top + 15)
        .attr("fill", "#666666")
        .attr("font-size", "12px")
        .text(
          `O:${candle.open.toFixed(2)} H:${candle.high.toFixed(
            2
          )} L:${candle.low.toFixed(2)} C:${candle.close.toFixed(2)}`
        );
    }

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#6b7280")
      .attr("font-size", "12px");
  }, [hoverIndex, candles, prices, height, width]);

  return <svg ref={ref} width={width} height={height} />;
}

// MARK: Types

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
