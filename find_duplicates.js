
const fs = require('fs');
const content = fs.readFileSync('d:/ems-employee-management-system/frontend/src/constants/messages.ts', 'utf8');

const lines = content.split('\n');
let stack = [];
let currentObject = null;
let duplicates = [];

lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    
    // Simple object detection
    if (trimmed.endsWith('{')) {
        const match = trimmed.match(/^([A-Z0-9_]+):\s*{/);
        const name = match ? match[1] : 'unknown';
        stack.push({ name, keys: new Map(), startLine: lineNumber });
    } else if (trimmed === '},' || trimmed === '}') {
        stack.pop();
    } else {
        const keyMatch = trimmed.match(/^([A-Z0-9_]+):/);
        if (keyMatch && stack.length > 0) {
            const key = keyMatch[1];
            const current = stack[stack.length - 1];
            if (current.keys.has(key)) {
                duplicates.push({
                    key,
                    object: current.name,
                    firstLine: current.keys.get(key),
                    secondLine: lineNumber
                });
            } else {
                current.keys.set(key, lineNumber);
            }
        }
    }
});

console.log(JSON.stringify(duplicates, null, 2));
