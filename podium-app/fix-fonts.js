const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
            walk(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const newContent = content.replace(/fontFamily: "Inter_[^"]*"/g, 'fontFamily: "System"');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log('Updated:', file);
            }
        }
    }
}

walk(path.join(__dirname, 'app'));
walk(path.join(__dirname, 'store'));
console.log('Done!');
