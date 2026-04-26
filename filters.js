// Global state
window.currentSectors = ["All"];

window.filterSector = function(sector, btn) {
    const d3Btn = d3.select(btn);
    
    if (sector === "All") {
        window.currentSectors = ["All"];
        d3.selectAll(".sector-btn").classed("active", false);
        d3Btn.classed("active", true);
    } else {
        // Remove "All" if a specific sector is clicked
        if (window.currentSectors.includes("All")) {
            window.currentSectors = [];
            d3.selectAll(".sector-btn").filter(function() {
                return d3.select(this).text() === "All";
            }).classed("active", false);
        }

        const index = window.currentSectors.indexOf(sector);
        if (index > -1) {
            window.currentSectors.splice(index, 1);
            d3Btn.classed("active", false);
        } else {
            window.currentSectors.push(sector);
            d3Btn.classed("active", true);
        }

        // Default back to All if nothing is selected
        if (window.currentSectors.length === 0) {
            window.currentSectors = ["All"];
            d3.selectAll(".sector-btn").filter(function() {
                return d3.select(this).text() === "All";
            }).classed("active", true);
        }
    }

    // This is the CRITICAL line: it calls the draw function on whatever page you are on
    if (typeof updatePlot === "function") {
        updatePlot();
    }
};