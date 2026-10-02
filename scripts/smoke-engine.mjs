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
