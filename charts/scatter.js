let currentSlide = 0;
const totalSlides = 2;

function moveSlide(direction) {
    const track = document.getElementById('main-track');
    const leftArrow = document.querySelector('.nav-arrow.left');
    const rightArrow = document.querySelector('.nav-arrow.right');
    
    // 1. Update the index
    currentSlide += direction;

    // 2. Clamp the index (No looping)
    if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;
    if (currentSlide < 0) currentSlide = 0;

    // 3. Show/Hide Arrows logic
    if (currentSlide === 0) {
        leftArrow.style.display = 'none';   // Hide left on page 1
        rightArrow.style.display = 'flex';  // Show right on page 1
    } else {
        leftArrow.style.display = 'flex';  // Show left on page 2
        rightArrow.style.display = 'none'; // Hide right on page 2
    }

    // 4. Calculate the move (50% because track is 200% wide for 2 slides)
    const moveAmount = currentSlide * 50; 
    track.style.transform = `translateX(-${moveAmount}%)`;
}

// Initialize arrows on page load
document.addEventListener("DOMContentLoaded", function() {
    moveSlide(0); 
});

/* --- Company Search Logic (Kept exactly as you had it) --- */
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