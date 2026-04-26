// referenced https://observablehq.com/@d3/histogram

var heightDist = 600;
var widthDist = 900;
var bufferDist = 100;

var svgDist = d3.select("#viz")
    .append("svg")
    .attr("width", widthDist)
    .attr("height", heightDist)
    .attr("id", "histogram");

var rawDataDist; 

d3.csv("data/sp500_ipo_summary.csv", function(error, data) {
    if (error) throw error;
    rawDataDist = data;
    window.updatePlot(); // Initial call
});

// Generic name so filters.js can call it
window.updatePlot = function() {
    svgDist.selectAll("*").remove();

    // Use global state from filters.js
    var filteredData = rawDataDist;
    if (window.currentSectors && !window.currentSectors.includes("All")){
        filteredData = rawDataDist.filter(function(d){
            return window.currentSectors.includes(d.Sector);
        });
    }

    var dataRange = d3.extent(filteredData, function(d){ return + d.IPO_Day_Return_Pct; });
    var minVal = dataRange[0] || -10;
    var maxVal = dataRange[1] || 60;

    var bins = d3.histogram()
        .value(function(d) { return + d.IPO_Day_Return_Pct; })
        .domain([minVal, maxVal])
        .thresholds(20)(filteredData);

    var maxy = d3.max(bins, function(d){ return d.length; }) || 10;

    var yscale = d3.scaleLinear()
        .domain([0, maxy])
        .range([heightDist - 2 * bufferDist, 0]);

    var xscale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([0, widthDist - 2 * bufferDist]);

    svgDist.append("g")
        .attr("transform", "translate(" + bufferDist + "," + bufferDist + ")")
        .call(d3.axisLeft(yscale));

    svgDist.append("g")
        .attr("transform", "translate(" + bufferDist + "," + (heightDist - bufferDist) + ")")
        .call(d3.axisBottom(xscale));

    svgDist.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", function(d) { return bufferDist + xscale(d.x0); })
        .attr("y", function(d) { return bufferDist + yscale(d.length); })
        .attr("width", function(d) { 
            return Math.max(0, xscale(d.x1) - xscale(d.x0) - 1); 
        })
        .attr("height", function(d) { return (heightDist - 2 * bufferDist) - yscale(d.length); })
        .attr("fill", "#d32f2f")
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .on("mouseover", function() { d3.select(this).style("fill", "black"); })
        .on("mouseout", function() { d3.select(this).style("fill", "#d32f2f"); });

    svgDist.selectAll(".bar-label")
        .data(bins)
        .enter()
        .append("text")
        .attr("style", "font-family: arial; font-size: 12px; fill: #d32f2f;")
        .attr("x", function(d) { 
            return bufferDist + xscale(d.x0) + (xscale(d.x1) - xscale(d.x0)) / 2; 
        })
        .attr("y", function(d) { return bufferDist + yscale(d.length) - 5; })
        .attr("text-anchor", "middle")
        .text(function(d) { return d.length > 0 ? d.length : ""; });
};