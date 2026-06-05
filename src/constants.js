export const PAL = {
  bg: "#0f0d09", card: "#141109", cream: "#e8dfd0", muted: "#8a7e6b",
  border: "#2a2318", gold: "#c5a46d", rose: "#b5546a", sage: "#7a927a", plum: "#7a5073",
};
export const NOTE_COLORS = ["#c5a46d","#b5546a","#d4b896","#7a927a","#7a5073","#c98a3e","#6b3a2a","#8a7e6b","#a36b4f","#5e7a6e"];
export const FONT_LINK = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap";
export const ff = { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', sans-serif" };

export const STATUS_COLORS = { "owned": "#7a927a", "had": "#8a7e6b", "want": "#c5a46d", "want to try": "#7a5073" };
export const STATUSES = ["owned", "had", "want", "want to try"];

export const sum = (arr, k) => arr.reduce((s, x) => s + (x[k] || 0), 0);
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
export function getFirstDayOfWeek(year, month) { return new Date(year, month, 1).getDay(); }
export function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
