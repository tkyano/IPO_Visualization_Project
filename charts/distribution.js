// referenced https://observablehq.com/@d3/histogram

// dimensions
var height = 600;
var width = 900;
var buffer = 100;
var maxx = 100; // will be the max return %
var maxy = 50; // will be the number of companies

var svg = d3.select("#viz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "histogram")

// loading data from the google drive folder
d3.csv("data/sp500_ipo_summary.csv", function(error, data) {
    if (error) throw error;

    // filters.js should call this function when the user selects buttons on the page
    window.updateChartData = function(selectedSectors) {

        svg.selectAll("*").remove(); // clears the board before redrawing

        var filteredData = data;
        if (!selectedSectors.includes("All")){
            filteredData = data.filter(function(d){
                return selectedSectors.includes(d.Sector)
            })
        }

        // creating the range using extent()
        // from https://www.geeksforgeeks.org/javascript/d3-js-d3-extent-function/
        var dataRange = d3.extent(filteredData, function(d){ return + d.IPO_Day_Return_Pct; })
        var minVal = dataRange[0] || -10;
        var maxVal = dataRange[1] || 60;

        // making the csv into x,y points
        var bins = d3.histogram()
            .value(function(d) { return + d.IPO_Day_Return_Pct; })
            .domain([minVal, maxVal])
            .thresholds(20)(filteredData);

        var points = bins.map(function(d){ return [d.x0, d.length]; });

        var maxy = d3.max(points, function(d){ return d[1]; }) || 10;

        var yscale = d3.scaleLinear()
            .domain([0, maxy])
            .range([height - 2 * buffer, 0]);

        var xscale = d3.scaleLinear()
            .domain([minVal, maxVal])
            .range([0, width - 2 * buffer]);

        svg.append("g")
            .attr("transform", "translate(" + buffer + "," + buffer + ")")
            .call(d3.axisLeft(yscale));

        svg.append("g")
            .attr("transform", "translate(" + buffer + "," + (height - buffer) + ")")
            .call(d3.axisBottom(xscale));

        svg.selectAll("rect")
            .data(points)
            .enter()
            .append("rect")
            .attr("x", function(d) { return buffer + xscale(d[0]); })
            .attr("y", function(d) { return buffer + yscale(d[1]); })
            .attr("width", Math.max(0, (width - 2 * buffer) / points.length - 1))
            .attr("height", function(d) { return (height - 2 * buffer) - yscale(d[1]); })
            .attr("fill", "#d32f2f")
            .attr("stroke", "white")
            .on("mouseover", function() { d3.select(this).style("fill", "black"); })
            .on("mouseout", function() { d3.select(this).style("fill", "#d32f2f"); })


        svg.selectAll(".bar-label")
            .data(points)
            .enter()
            .append("text")
            .attr("style", "font-family: arial; font-size: 12px; fill: #d32f2f;")
            // logic: start of bar + (total bar width / 2)
            .attr("x", function(d) { 
                var barWidth = (width - 2 * buffer) / points.length;
                return buffer + xscale(d[0]) + (barWidth / 2); 
            })
            .attr("y", function(d) { return buffer + yscale(d[1]) - 5; })
            .attr("text-anchor", "middle") // This ensures the text itself is centered on that point
            .text(function(d) { return d[1] > 0 ? d[1] : ""; });

    };

    updateChartData(["All"]);

});