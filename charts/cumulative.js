// --- Global State ---
let currentSlide = 0;
const totalSlides = 2;
var rawData = [];
var selectedCompanies = []; 
var currentSectors = ["All"]; 
var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

var margin = {top: 40, right: 150, bottom: 60, left: 70},
    width = 900 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

// --- Data Loading ---
d3.queue()
    .defer(d3.csv, "data/sp500_ipo_summary.csv")
    .defer(d3.csv, "data/sp500_first_month_data.csv")
    .await(function(error, summary, timeseries) {
        if (error) throw error;
        
        var nestedPrices = d3.nest().key(d => d.Ticker).entries(timeseries);
        rawData = [];
        
        nestedPrices.forEach(tickerGroup => {
            var sMatch = summary.find(s => s.Ticker === tickerGroup.key);
            if (!sMatch) return;

            var basePrice = +tickerGroup.values[0].Close;
            rawData.push({
                ticker: tickerGroup.key,
                name: sMatch.Name,
                sector: sMatch.Sector,
                returns: tickerGroup.values.map((d, i) => ({
                    day: i + 1,
                    cumReturn: ((+d.Close - basePrice) / basePrice) * 100
                }))
            });
        });

        updateCumulativePlot(); 
    });

// --- Slide 1: Sector Chart ---
window.updateCumulativePlot = function() {
    d3.select("#viz").selectAll("*").remove();
    
    var svg = d3.select("#viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- Scales ---
    // FIX: Set X domain dynamically based on data length (usually ~21-23 days)
    var maxDay = d3.max(rawData, d => d.returns.length) || 23;
    var x = d3.scaleLinear().domain([1, maxDay]).range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // Filter "Unknown"
    var dataBySector = d3.nest()
        .key(d => d.sector)
        .entries(rawData)
        .filter(d => d.key && d.key !== "" && d.key !== "Unknown" && d.key !== "undefined");
    
    var filtered = dataBySector.filter(d => {
        if (currentSectors.includes("All")) return true;
        return currentSectors.includes(d.key);
    });

    var lines = filtered.map(group => ({
        label: group.key,
        values: d3.range(1, maxDay + 1).map(day => ({
            day: day,
            avg: d3.mean(group.values, t => {
                var dData = t.returns.find(r => r.day === day);
                return dData ? dData.cumReturn : null;
            }) || 0
        }))
    }));

    if (lines.length === 0) {
        g.append("text").attr("x", width/2).attr("y", height/2).attr("text-anchor", "middle").text("No sectors selected");
        return;
    }

    y.domain([
        d3.min(lines, l => d3.min(l.values, v => v.avg)) - 2, 
        d3.max(lines, l => d3.max(l.values, v => v.avg)) + 2
    ]);

    // --- Axes ---
    var xAxis = d3.axisBottom(x).tickFormat(d => "Day "+d);
    var yAxis = d3.axisLeft(y).tickFormat(d => d + "%");

    var gX = g.append("g").attr("transform", `translate(0,${height})`).call(xAxis);
    var gY = g.append("g").call(yAxis);

    // --- Clip Path ---
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var lineContainer = g.append("g").attr("clip-path", "url(#clip)");

    // --- Line Generator ---
    var lineGen = d3.line()
        .x(d => x(d.day))
        .y(d => y(d.avg))
        .curve(d3.curveMonotoneX);

    // --- Drawing Lines with Hover ---
    lines.forEach((l, i) => {
        var path = lineContainer.append("path")
            .datum(l.values)
            .attr("class", "sector-line")
            .attr("fill", "none")
            .attr("stroke", colorScale(l.label))
            .attr("stroke-width", 2.5)
            .attr("d", lineGen)
            .style("cursor", "pointer");

        path.on("mouseover", function() {
            d3.selectAll(".sector-line").style("opacity", 0.15);
            d3.select(this).style("opacity", 1).attr("stroke-width", 5);
        }).on("mouseout", function() {
            d3.selectAll(".sector-line").style("opacity", 1);
            d3.select(this).attr("stroke-width", 2.5);
        });

        // Legend
        var leg = g.append("g").attr("transform", `translate(${width + 10}, ${i * 20})`);
        leg.append("rect").attr("width", 12).attr("height", 12).attr("fill", colorScale(l.label));
        leg.append("text").attr("x", 18).attr("y", 10).style("font-size", "10px").text(l.label);
    });

    // --- Zoom Logic ---
    // FIX: translateExtent prevents the chart from sliding to "Day -2"
    var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [width, height]]) 
        .extent([[0, 0], [width, height]])
        .on("zoom", function() {
            var newX = d3.event.transform.rescaleX(x);
            var newY = d3.event.transform.rescaleY(y);

            gX.call(xAxis.scale(newX));
            gY.call(yAxis.scale(newY));

            lineContainer.selectAll(".sector-line")
                .attr("d", d3.line()
                    .x(d => newX(d.day))
                    .y(d => newY(d.avg))
                    .curve(d3.curveMonotoneX)
                );
        });

    // Zoom Capture Overlay
    g.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(zoom);
};

// --- Slide 2: Manual Search Logic ---
function executeManualSearch() {
    const inputField = document.getElementById('company-search-input');
    const input = inputField.value.toUpperCase().trim();
    if (input.length < 1) return;

    const result = rawData.find(d => d.ticker === input || d.name.toUpperCase() === input || d.name.toUpperCase().includes(input));

    if (result) {
        if (!selectedCompanies.find(c => c.ticker === result.ticker)) {
            selectedCompanies.push(result);
            renderChips();
            updateDeepDiveChart();
        }
        inputField.value = ""; 
    } else {
        alert("Company not found. Try a specific ticker like 'AAPL'.");
    }
}

document.getElementById('company-search-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') executeManualSearch();
});

function renderChips() {
    const tray = document.getElementById('company-chips');
    tray.innerHTML = "";
    selectedCompanies.forEach(c => {
        const chip = document.createElement('div');
        chip.style = `background:${colorScale(c.ticker)}; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:8px;`;
        chip.innerHTML = `${c.ticker} <span style="font-size:16px;">&times;</span>`;
        chip.onclick = () => {
            selectedCompanies = selectedCompanies.filter(comp => comp.ticker !== c.ticker);
            renderChips();
            updateDeepDiveChart();
        };
        tray.appendChild(chip);
    });
}

function clearDeepDive() {
    selectedCompanies = [];
    renderChips();
    updateDeepDiveChart();
}

function updateDeepDiveChart() {
    d3.select("#company-viz").selectAll("*").remove();
    if (selectedCompanies.length === 0) return;

    var svg = d3.select("#company-viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // FIX: Apply same dynamic maxDay for deep dive
    var maxDay = d3.max(selectedCompanies, c => c.returns.length) || 23;
    var x = d3.scaleLinear().domain([1, maxDay]).range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    var allY = [];
    selectedCompanies.forEach(c => c.returns.forEach(r => allY.push(r.cumReturn)));
    y.domain([d3.min(allY) - 2, d3.max(allY) + 2]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d => "Day "+d));
    svg.append("g").call(d3.axisLeft(y).tickFormat(d => d + "%"));

    var lineGen = d3.line().x(d => x(d.day)).y(d => y(d.cumReturn)).curve(d3.curveMonotoneX);

    selectedCompanies.forEach((c, i) => {
        var path = svg.append("path")
            .datum(c.returns)
            .attr("class", "company-line")
            .attr("fill", "none")
            .attr("stroke", colorScale(c.ticker))
            .attr("stroke-width", 3)
            .attr("d", lineGen);

        path.on("mouseover", function() {
            d3.selectAll(".company-line").style("opacity", 0.1);
            d3.select(this).style("opacity", 1).attr("stroke-width", 6);
        }).on("mouseout", function() {
            d3.selectAll(".company-line").style("opacity", 1);
            d3.select(this).attr("stroke-width", 3);
        });
        
        var leg = svg.append("g").attr("transform", `translate(${width + 10}, ${i * 22})`);
        leg.append("rect").attr("width", 14).attr("height", 14).attr("fill", colorScale(c.ticker));
        leg.append("text").attr("x", 20).attr("y", 12).style("font-size", "11px").style("font-weight","bold").text(c.ticker);
    });
}

// --- Navigation & Slide Logic ---
function moveSlide(direction) {
    currentSlide += direction;
    if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;
    if (currentSlide < 0) currentSlide = 0;
    document.getElementById('left-arrow').style.display = currentSlide === 0 ? 'none' : 'flex';
    document.getElementById('right-arrow').style.display = currentSlide === 1 ? 'none' : 'flex';
    document.getElementById('main-track').style.transform = `translateX(-${currentSlide * 50}%)`;
}

window.filterSector = function(sector, btn) {
    if (sector === "All") {
        currentSectors = ["All"];
        d3.selectAll(".sector-btn").classed("active", false);
        d3.select(btn).classed("active", true);
    } else {
        if (currentSectors.includes("All")) {
            currentSectors = [];
            d3.selectAll(".sector-btn").classed("active", false);
        }
        var idx = currentSectors.indexOf(sector);
        if (idx > -1) {
            currentSectors.splice(idx, 1);
            d3.select(btn).classed("active", false);
        } else {
            currentSectors.push(sector);
            d3.select(btn).classed("active", true);
        }
        if (currentSectors.length === 0) {
            currentSectors = ["All"];
            d3.selectAll(".sector-btn").filter(function() { return d3.select(this).text() === "All"; }).classed("active", true);
        }
    }
    updateCumulativePlot();
};