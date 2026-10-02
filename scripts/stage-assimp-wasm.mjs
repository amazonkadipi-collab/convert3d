import { copyFileSync, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const source="node_modules/assimpjs/dist/assimpjs.wasm";
const targets=["api/assimpjs.wasm","public/assimpjs.wasm"];

if(!existsSync(source)) throw new Error("Assimp WASM source file is missing: "+source);
await mkdir("api",{recursive:true});
await mkdir("public",{recursive:true});

for(const target of targets) copyFileSync(source,target);
console.log("Staged Assimp WASM:");
for(const target of targets) console.log(" -",target);
