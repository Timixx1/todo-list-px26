const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.querySelector(".theme-toggle-label");
const savedTheme = localStorage.getItem("px26-theme") || "light";

const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    localStorage.setItem("px26-theme", theme);

    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
};

applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
});
