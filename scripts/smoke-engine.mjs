globalThis.requestAnimationFrame=(cb)=>setImmediate(cb);

class NodeFileReader {
  constructor(){ this.result=null; this.onload=null; this.onerror=null; this.onloadend=null; }
  readAsArrayBuffer(blob){
    Promise.resolve(blob.arrayBuffer()).then(buffer=>{
      this.result=buffer;
      this.onload?.({target:this});
      this.onloadend?.({target:this});
    }).catch(error=>this.onerror?.(error));
  }
  readAsDataURL(blob){
    Promise.resolve(blob.arrayBuffer()).then(buffer=>{
      const type=blob.type||"application/octet-stream";
      this.result="data:"+type+";base64,"+Buffer.from(buffer).toString("base64");
      this.onload?.({target:this});
      this.onloadend?.({target:this});
    }).catch(error=>this.onerror?.(error));
  }
}
globalThis.FileReader=NodeFileReader;

import * as THREE from "three";
import {exportModel} from "../src/engine.js";

const geometry=new THREE.BoxGeometry(1,1,1);
const material=new THREE.MeshStandardMaterial();
const mesh=new THREE.Mesh(geometry,material);

const outputs=["obj","stl","ply","gltf","glb","usdz"];
for(const target of outputs){
  const result=await exportModel(mesh,target);
  if(!result?.blob||result.blob.size<=0) throw new Error(target+" exporter returned an empty file");
  console.log(target+" OK "+result.blob.size+" bytes");
}
console.log("All browser exporters passed.");

// Compression integration smoke test: a dense sphere must simplify and still export to a non-empty GLB.
const dense=new THREE.SphereGeometry(2,40,30);
const denseMesh=new THREE.Mesh(dense,new THREE.MeshStandardMaterial());
const compressed=await (await import("../src/engine.js")).compressModel(denseMesh,"small");
if(!compressed?.changed) throw new Error("Compression did not report a geometry change for a dense test mesh");
if(!compressed?.blob||compressed.blob.size<=0) throw new Error("Compression returned an empty GLB");
console.log("compressModel GLB smoke test: OK ("+compressed.blob.size+" bytes)");

