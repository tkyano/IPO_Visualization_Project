// Global state: which sectors are currently "on"
let activeSectors = ["All"];

function filterSector(sector, element) {
    const parent = element.parentElement;
    const allButtons = parent.querySelectorAll('.sector-btn');
    const allBtn = Array.from(allButtons).find(btn => btn.innerText === 'All');

    if (sector === 'All') {
        // Reset to "All" only
        activeSectors = ["All"];
        allButtons.forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    } else {
        // 1. If we were on "All", start a fresh list
        if (activeSectors.includes("All")) {
            activeSectors = [];
            if (allBtn) allBtn.classList.remove('active');
        }

        // 2. Toggle the specific sector
        if (activeSectors.includes(sector)) {
            activeSectors = activeSectors.filter(s => s !== sector);
            element.classList.remove('active');
        } else {
            activeSectors.push(sector);
            element.classList.add('active');
        }

        // 3. Fallback: if user deselects everything, go back to "All"
        if (activeSectors.length === 0) {
            activeSectors = ["All"];
            if (allBtn) allBtn.classList.add('active');
        }
    }

    console.log("Active Filter Array:", activeSectors);

    // This globally available function will be defined in your specific chart.js files
    if (typeof updateChartData === "function") {
        updateChartData(activeSectors);
    }
}