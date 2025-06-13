import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface RadarProps {
  data: {
    name: string;
    value: number;
  }[];
  width?: number;
  height?: number;
}

const Radar: React.FC<RadarProps> = ({ 
  data, 
  width = 400, 
  height = 400 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Calculate angles for each data point
    const angleSlice = (Math.PI * 2) / data.length;

    // Create scales
    const radius = Math.min(width, height) / 2;
    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, 1]);

    // Create the radar chart
    const radarLine = d3.lineRadial<{ value: number }>()
      .radius(d => rScale(d.value))
      .angle((_, i) => i * angleSlice);

    // Create the background circles
    const levels = 5;
    const gridCircles = svg.selectAll(".gridCircle")
      .data(d3.range(1, levels + 1).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", d => radius / levels * d)
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", 0.1);

    // Create the axes
    const axes = svg.selectAll(".axis")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "axis");

    // Add the axis lines
    axes.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (_, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (_, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("class", "line")
      .style("stroke", "white")
      .style("stroke-width", "2px");

    // Add the labels
    axes.append("text")
      .attr("class", "legend")
      .style("font-size", "11px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (_, i) => rScale(1.15) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (_, i) => rScale(1.15) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d.name)
      .call(wrap, 60);

    // Draw the radar
    svg.append("path")
      .datum(data)
      .attr("class", "radarArea")
      .attr("d", radarLine)
      .style("fill", "#BADA55")
      .style("fill-opacity", 0.4)
      .style("stroke", "#BADA55")
      .style("stroke-width", "2px");

    // Wrap text function
    function wrap(text: d3.Selection<SVGTextElement, any, any, any>, width: number) {
      text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node()?.getComputedTextLength()! > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }
  }, [data, width, height]);

  return (
    <svg ref={svgRef} style={{ margin: '20px' }} />
  );
};

export default Radar; 