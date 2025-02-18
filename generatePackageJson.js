import fs from 'fs';
import os from 'os';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

delete packageJson.dependencies["tweakpane"];

packageJson.browser = "renderblade.js"
packageJson.types = "renderblade.d.ts"
packageJson.private = false;
packageJson.version = process.argv[2].replace("refs/tags/", "");
packageJson.name = "@EggAllocationService/renderblade";

fs.writeFileSync('./dist/package.json', JSON.stringify(packageJson, null, 2));