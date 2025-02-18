import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

delete packageJson.dependencies["tweakpane"];

packageJson.browser = "renderblade.js"
packageJson.types = "renderblade.d.ts"
packageJson.private = "false"

fs.writeFileSync('./dist/package.json', JSON.stringify(packageJson, null, 2));