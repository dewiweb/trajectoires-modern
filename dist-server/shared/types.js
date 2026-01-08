// Core types shared between client and server
// Source colors matching original app
export const SOURCE_COLORS = {
    1: '#e94560', // Red-pink
    2: '#f39c12', // Orange
    3: '#2ecc71', // Green
    4: '#3498db', // Blue
    5: '#9b59b6', // Purple
    6: '#1abc9c', // Teal
    7: '#e67e22', // Dark orange
    8: '#95a5a6', // Gray
};
export function getSourceColor(sourceNumber) {
    return SOURCE_COLORS[sourceNumber] || SOURCE_COLORS[1];
}
// Generate unique IDs
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
