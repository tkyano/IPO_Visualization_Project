var rawDataBox;
var totalWidthBox = 1000;
var heightBox = 500;
var marginBox = {top: 70, right: 40, bottom: 60, left: 70};

var singleBoxWidth = (totalWidthBox / 2) - marginBox.left - marginBox.right;
var plotHeight = heightBox - marginBox.top - marginBox.bottom;

var svgBox = d3.select("#viz")
    .append("svg")
    .attr("width", totalWidthBox)
    .attr("height", heightBox);

d3.csv("data/sp500_ipo_summary.csv", function(error, data) {
    if (error) throw error;
    rawDataBox = data;
    window.updatePlot();
});

window.updatePlot = function() {
    svgBox.selectAll("*").remove();

    var filteredData = rawDataBox;
    if (window.currentSectors && !window.currentSectors.includes("All")) {
        filteredData = rawDataBox.filter(function(d) {
            return window.currentSectors.includes(d.Sector);
        });
    }

    drawSingleBoxPlot(
        filteredData, 
        "IPO_Day_Return_Pct", 
        "Day 1 Return Dispersion", 
        svgBox.append("g").attr("transform", "translate(" + marginBox.left + "," + marginBox.top + ")"),
        "#69b3a2"
    );

    drawSingleBoxPlot(
        filteredData, 
        "Month_Return_Pct", 
        "1-Month Return Dispersion", 
        svgBox.append("g").attr("transform", "translate(" + (totalWidthBox / 2 + marginBox.left) + "," + marginBox.top + ")"),
        "#4e79a7"
    );
};

function drawSingleBoxPlot(data, column, title, g, boxColor) {
    // Calculate Statistics
    var values = data.map(function(d) { return +d[column]; }).sort(d3.ascending);
    var q1 = d3.quantile(values, .25);
    var median = d3.quantile(values, .5);
    var q3 = d3.quantile(values, .75);
    var iqr = q3 - q1;
    var min = q1 - 1.5 * iqr;
    var max = q3 + 1.5 * iqr;

    var y = d3.scaleLinear()
        .domain([d3.min(values) - 5, d3.max(values) + 5])
        .nice()
        .range([plotHeight, 0]);

    var xCenter = singleBoxWidth / 2;

    g.append("text")
        .attr("x", xCenter)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-family", "Arial")
        .style("font-weight", "bold")
        .text(title);

    g.append("g").call(d3.axisLeft(y).tickFormat(d => d + "%"));

    g.append("line")
        .attr("x1", xCenter)
        .attr("x2", xCenter)
        .attr("y1", y(min))
        .attr("y2", y(max))
        .attr("stroke", "black");

    var boxWidth = 100;
    g.append("rect")
        .attr("x", xCenter - boxWidth/2)
        .attr("y", y(q3))
        .attr("height", Math.abs(y(q1) - y(q3)))
        .attr("width", boxWidth)
        .attr("stroke", "black")
        .style("fill", boxColor)
        .style("opacity", 0.7);

    g.append("line")
        .attr("x1", xCenter - boxWidth/2)
        .attr("x2", xCenter + boxWidth/2)
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("stroke", "black")
        .attr("stroke-width", 3);

    var outliers = data.filter(d => +d[column] < min || +d[column] > max);
    
    g.selectAll(".outlier")
        .data(outliers)
        .enter()
        .append("circle")
        .attr("cx", function() { return xCenter + (Math.random() - 0.5) * 40; })
        .attr("cy", d => y(+d[column]))
        .attr("r", 4)
        .style("fill", "black")
        .style("opacity", 0.3)
        .append("title")
        .text(d => d.Ticker + ": " + d[column] + "%");
}