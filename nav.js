document.addEventListener("DOMContentLoaded", function() {
    const currentPath = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll("nav ul li a");
    
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath === href || (currentPath === "" && href === "index.html")) {
            link.classList.add("active");
        }
    });
});