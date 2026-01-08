"use strict";
// Core types shared between client and server
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE_COLORS = void 0;
exports.getSourceColor = getSourceColor;
exports.generateId = generateId;
// Source colors matching original app
exports.SOURCE_COLORS = {
    1: '#e94560', // Red-pink
    2: '#f39c12', // Orange
    3: '#2ecc71', // Green
    4: '#3498db', // Blue
    5: '#9b59b6', // Purple
    6: '#1abc9c', // Teal
    7: '#e67e22', // Dark orange
    8: '#95a5a6', // Gray
};
function getSourceColor(sourceNumber) {
    return exports.SOURCE_COLORS[sourceNumber] || exports.SOURCE_COLORS[1];
}
// Generate unique IDs
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
