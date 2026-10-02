import { copyFileSync, existsSync } from "node:fs";
import { mkdir, stat } from "node:fs/promises";

const source="node_modules/assimpjs/dist/assimpjs.wasm";
const target="api/assimpjs.wasm";

if(!existsSync(source)) throw new Error("Assimp WASM source file is missing: "+source);
await mkdir("api",{recursive:true});
copyFileSync(source,target);
const info=await stat(target);
if(info.size<1000000) throw new Error("Assimp WASM staging produced an unexpectedly small file.");
console.log("Staged Assimp WASM:",target,info.size,"bytes");
