"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

type PriceChartProps = {
  data: number[];
};

export default function PriceChart({ data }: PriceChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    const width = 300;
    const height = 100;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    const x = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(data) || 0, d3.max(data) || 1])
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    if (!pathRef.current) {
      pathRef.current = svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("d", line(data) || "")
        .node();
    } else {
      d3.select(pathRef.current)
        .datum(data)
        .transition()
        .duration(400)
        .attr("d", line(data) || "");
    }
  }, [data]);

  return <svg ref={ref} width={300} height={100} />;
}
