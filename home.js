d3.csv("data/sp500_ipo_summary.csv", function(error, data) {
    if (error) {
        console.error("Error loading CSV for home page stats:", error);
        return;
    }

    var totalCompanies = data.length;

    var uniqueSectors = d3.nest()
        .key(function(d) { return d.Sector; })
        .entries(data)
        .length;

    var avgReturn = d3.mean(data, function(d) { 
        return +d.IPO_Day_Return_Pct; 
    });

    var maxReturn = d3.max(data, function(d) { 
        return +d.IPO_Day_Return_Pct; 
    });

    d3.select("#stat-universe").text(totalCompanies);
    d3.select("#stat-sectors").text(uniqueSectors);
    d3.select("#stat-avg-return").text("+" + avgReturn.toFixed(2) + "%");
    d3.select("#stat-max-return").text(maxReturn.toFixed(1) + "%");
});