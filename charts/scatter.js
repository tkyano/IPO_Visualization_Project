let currentSlide = 0;
const totalSlides = 2;

function moveSlide(direction) {
    const track = document.getElementById('main-track');
    const leftArrow = document.querySelector('.nav-arrow.left');
    const rightArrow = document.querySelector('.nav-arrow.right');
    
    currentSlide += direction;

    if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;
    if (currentSlide < 0) currentSlide = 0;

    if (currentSlide === 0) {
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'flex';
    } else {
        leftArrow.style.display = 'flex';
        rightArrow.style.display = 'none';
    }

    const moveAmount = currentSlide * 50; 
    track.style.transform = `translateX(-${moveAmount}%)`;
}

document.addEventListener("DOMContentLoaded", function() {
    moveSlide(0); 
});

function executeCompanySearch() {
    const input = document.getElementById('company-search-input').value.toUpperCase();
    const display = document.getElementById('search-result-display');

    d3.csv("data/sp500_ipo_summary.csv", function(error, data) {
        if (error) throw error;
        const result = data.find(d => 
            d.Ticker.toUpperCase() === input || 
            d.Name.toUpperCase().includes(input)
        );

        if (result) {
            display.innerHTML = `
                <div class="stat-box" style="margin-top: 20px; border-left: 5px solid var(--accent-color);">
                    <h2 style="margin-top:0;">${result.Name} (${result.Ticker})</h2>
                    <p><strong>Sector:</strong> ${result.Sector}</p>
                    <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><span class="control-label">IPO Open</span><div class="stat-number">$${(+result.IPO_Open).toFixed(2)}</div></div>
                        <div><span class="control-label">Day 1 Return</span><div class="stat-number" style="color: ${result.IPO_Day_Return_Pct >= 0 ? 'green' : 'red'}">${result.IPO_Day_Return_Pct}%</div></div>
                        <div><span class="control-label">Month End Close</span><div class="stat-number">$${(+result.Month_End_Close).toFixed(2)}</div></div>
                        <div><span class="control-label">Month 1 Return</span><div class="stat-number" style="color: ${result.Month_Return_Pct >= 0 ? 'green' : 'red'}">${result.Month_Return_Pct}%</div></div>
                    </div>
                </div>`;
        } else {
            display.innerHTML = `<p style="color: var(--accent-color); font-weight: bold; text-align: center;">Ticker not found.</p>`;
        }
    });
}

var margin = {top: 40, right: 30, bottom: 60, left: 70},
    width = 900 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

var svg = d3.select("#viz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("body").append("div")
    .attr("style", "position: absolute; opacity: 0; background: #fff; border: 1px solid #ccc; padding: 10px; border-radius: 5px; pointer-events: none; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000; font-family: sans-serif;");

var scatterData;
var currentSectors = ["All"];

d3.csv("data/sp500_ipo_summary.csv", function(error, data) {
    if (error) throw error;
    scatterData = data;
    updateScatterAxes();
});

window.updateScatterAxes = function() {
    if (!scatterData) return;

    var xSelect = document.getElementById("x-axis");
    var ySelect = document.getElementById("y-axis");
    var xKey = xSelect.value;
    var yKey = ySelect.value;
    var xLabelText = xSelect.options[xSelect.selectedIndex].text;
    var yLabelText = ySelect.options[ySelect.selectedIndex].text;

    var filtered = scatterData;
    if (!currentSectors.includes("All")) {
        filtered = scatterData.filter(function(d) {
            return currentSectors.includes(d.Sector);
        });
    }

    svg.selectAll("*").remove();

    var x = d3.scaleLinear()
        .domain(d3.extent(filtered, function(d) { return +d[xKey]; })).nice()
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain(d3.extent(filtered, function(d) { return +d[yKey]; })).nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Centered X Axis Label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("style", "font-size: 14px; font-weight: bold; font-family: arial;")
        .text(xLabelText);

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("style", "font-size: 14px; font-weight: bold; font-family: arial;")
        .text(yLabelText);

    svg.selectAll(".dot")
        .data(filtered)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return x(+d[xKey]); })
        .attr("cy", function(d) { return y(+d[yKey]); })
        .attr("r", 6)
        .attr("fill", "#d32f2f")
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .on("mouseover", function(d) {
            d3.select(this).attr("r", 10).attr("fill", "black").attr("opacity", 1);
            
            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(
                "<strong>" + d.Name + " (" + d.Ticker + ")</strong><br/>" +
                "Sector: " + d.Sector + "<br/>" +
                xLabelText + ": " + (+d[xKey]).toFixed(2) + (xKey.includes("Pct") ? "%" : "") + "<br/>" + 
                yLabelText + ": " + (+d[yKey]).toFixed(2) + (yKey.includes("Pct") ? "%" : "")
            )
            .style("left", (d3.event.pageX + 15) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mousemove", function() {
            tooltip.style("left", (d3.event.pageX + 15) + "px")
                   .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 6).attr("fill", "#d32f2f").attr("opacity", 0.7);
            tooltip.transition().duration(200).style("opacity", 0);
        });
};

window.filterSector = function(sector, btn) {
    var d3Btn = d3.select(btn);

    if (sector === "All") {
        currentSectors = ["All"];
        d3.selectAll(".sector-btn").classed("active", false);
        d3Btn.classed("active", true);
    } else {
        if (currentSectors.includes("All")) {
            currentSectors = [];
            d3.selectAll(".sector-btn").classed("active", false);
        }

        var index = currentSectors.indexOf(sector);
        if (index > -1) {
            currentSectors.splice(index, 1);
            d3Btn.classed("active", false);
        } else {
            currentSectors.push(sector);
            d3Btn.classed("active", true);
        }

        if (currentSectors.length === 0) {
            currentSectors = ["All"];
            d3.select(".sector-btn").classed("active", true); // Assumes first button is All
        }
    }
    
    updateScatterAxes();
};


function executeLiveSearch() {
    const input = document.getElementById('company-search-input').value.toUpperCase().trim();
    const display = document.getElementById('search-result-display');
    
    if (input.length < 1) {
        display.innerHTML = `<p style="text-align: center; color: #666; padding: 50px 0;">Enter a company name to see performance metrics.</p>`;
        return;
    }

    d3.csv("data/sp500_ipo_summary.csv", function(error, data) {
        if (error) throw error;
        
        // Search ONLY by company name
        const result = data.find(d => d.Name.toUpperCase().includes(input));

        if (result) {
            renderCompanyDeepDive(result);
        } else {
            display.innerHTML = `<p style="color: var(--accent-color); font-weight: bold; text-align: center;">No company found matching "${input}"</p>`;
        }
    });
}

function renderCompanyDeepDive(result) {
    const display = document.getElementById('search-result-display');
    
    display.innerHTML = `
        <div class="stat-box" style="margin-top: 20px; border-left: 5px solid var(--accent-color); padding: 20px; background: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h2 style="margin-top:0; color: #333;">${result.Name} (${result.Ticker})</h2>
            <div style="display: flex; flex-direction: column; gap: 20px;">
                
                <p style="font-size: 1.1em; margin-bottom: 5px;"><strong>Sector:</strong> ${result.Sector}</p>
                
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;">
                    <div>
                        <span class="control-label" style="display: block; color: #666; font-size: 0.9em; margin-bottom: 5px;">IPO Open</span>
                        <div class="stat-number" style="font-size: 1.6em; font-weight: bold;">$${(+result.IPO_Open).toFixed(2)}</div>
                    </div>
                    <div>
                        <span class="control-label" style="display: block; color: #666; font-size: 0.9em; margin-bottom: 5px;">Day 1 Return</span>
                        <div class="stat-number" style="font-size: 1.6em; font-weight: bold; color: ${+result.IPO_Day_Return_Pct >= 0 ? '#2e7d32' : '#d32f2f'}">
                            ${(+result.IPO_Day_Return_Pct).toFixed(2)}%
                        </div>
                    </div>
                    <div>
                        <span class="control-label" style="display: block; color: #666; font-size: 0.9em; margin-bottom: 5px;">Month End Close</span>
                        <div class="stat-number" style="font-size: 1.6em; font-weight: bold;">$${(+result.Month_End_Close).toFixed(2)}</div>
                    </div>
                    <div>
                        <span class="control-label" style="display: block; color: #666; font-size: 0.9em; margin-bottom: 5px;">Month 1 Return</span>
                        <div class="stat-number" style="font-size: 1.6em; font-weight: bold; color: ${+result.Month_Return_Pct >= 0 ? '#2e7d32' : '#d32f2f'}">
                            ${(+result.Month_Return_Pct).toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}