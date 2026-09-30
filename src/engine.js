import * as THREE from "three";
import {OBJLoader} from "three/addons/loaders/OBJLoader.js";
import {STLLoader} from "three/addons/loaders/STLLoader.js";
import {PLYLoader} from "three/addons/loaders/PLYLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {ColladaLoader} from "three/addons/loaders/ColladaLoader.js";
import {ThreeMFLoader} from "three/addons/loaders/3MFLoader.js";
import {TDSLoader} from "three/addons/loaders/TDSLoader.js";
import {OBJExporter} from "three/addons/exporters/OBJExporter.js";
import {STLExporter} from "three/addons/exporters/STLExporter.js";
import {PLYExporter} from "three/addons/exporters/PLYExporter.js";
import {GLTFExporter} from "three/addons/exporters/GLTFExporter.js";
import {USDLoader} from "three/addons/loaders/USDLoader.js";
import {SimplifyModifier} from "three/addons/modifiers/SimplifyModifier.js";

const localInputs=new Set(["obj","stl","ply","fbx","gltf","glb","dae","3mf","3ds","usd","usda","usdc","usdz"]);
const cadInputs=new Set(["step","stp","iges","igs","brep"]);

function normalizeRoot(root){
  root.traverse?.(o=>{
    if(o.isMesh){
      if(!o.material) o.material=new THREE.MeshStandardMaterial({color:0x9eb1c7,metalness:.1,roughness:.65});
      if(o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    }
  });
  return root;
}
function fromOcct(result){
  if(!result?.success) throw new Error("CAD parser could not read this model.");
  const root=new THREE.Group();
  for(const m of result.meshes||[]){
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(m.attributes.position.array,3));
    if(m.attributes.normal) g.setAttribute("normal",new THREE.Float32BufferAttribute(m.attributes.normal.array,3));
    if(m.index?.array) g.setIndex(new THREE.BufferAttribute(Uint32Array.from(m.index.array),1));
    if(!g.attributes.normal) g.computeVertexNormals();
    const c=m.color||[0.62,0.69,0.78];
    root.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:new THREE.Color(c[0],c[1],c[2]),metalness:.12,roughness:.62})));
  }
  return root;
}
let assimpPromise=null;
async function loadAssimp(){
  if(!assimpPromise){const mod=await import("assimpjs");assimpPromise=mod.default?mod.default():mod();}
  return assimpPromise;
}
async function parseAssimp(file){
  const ajs=await loadAssimp();
  const list=new ajs.FileList();
  list.AddFile(file.name,new Uint8Array(await file.arrayBuffer()));
  const result=ajs.ConvertFileList(list,"glb2");
  if(!result.IsSuccess()||result.FileCount()===0)throw new Error("Assimp could not import this format.");
  const out=result.GetFile(0).GetContent();
  const loader=new GLTFLoader();
  return new Promise((resolve,reject)=>loader.parse(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),"",g=>resolve(normalizeRoot(g.scene)),reject));
}
let occtPromise=null;
async function loadOcct(){
  if(!occtPromise){
    occtPromise=(async()=>{const mod=await import("@sunbox/occt-import-js");return mod.default();})();
  }
  return occtPromise;
}
async function parseCad(file,ext){
  const occt=await loadOcct();
  const bytes=new Uint8Array(await file.arrayBuffer());
  const method=ext==="iges"||ext==="igs"?"ReadIgesFile":ext==="brep"?"ReadBrepFile":"ReadStepFile";
  const result=occt[method](bytes,null);
  return fromOcct(result);
}
async function parseLocal(file,ext){
  const bytes=await file.arrayBuffer();
  const text=()=>new TextDecoder().decode(bytes);
  if(ext==="obj") return normalizeRoot(new OBJLoader().parse(text()));
  if(ext==="stl"){const g=new STLLoader().parse(bytes);g.computeVertexNormals();return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8fa3bb,metalness:.05,roughness:.72}));}
  if(ext==="ply"){const g=new PLYLoader().parse(bytes);g.computeVertexNormals();return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8fa3bb,vertexColors:!!g.getAttribute("color"),metalness:.03,roughness:.75}));}
  if(ext==="fbx") return normalizeRoot(new FBXLoader().parse(bytes,""));
  if(ext==="dae") return normalizeRoot(new ColladaLoader().parse(text(),"").scene);
  if(ext==="3mf") return normalizeRoot(new ThreeMFLoader().parse(bytes));
  if(ext==="3ds") return normalizeRoot(new TDSLoader().parse(bytes,""));
  if(ext==="usd"||ext==="usda"||ext==="usdc"||ext==="usdz"){const loader=new USDLoader();return new Promise((resolve,reject)=>loader.parse(bytes,"",g=>resolve(normalizeRoot(g)),reject));}
  if(ext==="gltf"||ext==="glb"){
    const loader=new GLTFLoader();
    return new Promise((resolve,reject)=>loader.parse(bytes,"",g=>resolve(normalizeRoot(g.scene)),reject));
  }
  throw new Error("This format needs a server conversion engine in this build.");
}
export async function loadModel(file){
  const ext=file.name.split(".").pop()?.toLowerCase()||"";
  if(cadInputs.has(ext)) return {object:await parseCad(file,ext),source:ext,engine:"OpenCascade WASM"};
  if(localInputs.has(ext)) return {object:await parseLocal(file,ext),source:ext,engine:"Three.js browser parser"};
  try { return {object:await parseAssimp(file),source:ext,engine:"Assimp WASM browser importer"}; } catch (e) { throw new Error("Browser engine could not import ."+ext+". Configure a server conversion API for this format."); }
}
function collect(object){const root=new THREE.Group();root.add(object.clone(true));root.updateMatrixWorld(true);return root;}
export async function exportModel(object,target){
  const root=collect(object);
  if(target==="obj") return {blob:new Blob([new OBJExporter().parse(root)],{type:"text/plain"}),ext:"obj",mime:"text/plain"};
  if(target==="stl"){const data=new STLExporter().parse(root,{binary:true});return {blob:new Blob([data],{type:"application/octet-stream"}),ext:"stl",mime:"application/octet-stream"};}
  if(target==="ply"){
    return new Promise((resolve,reject)=>new PLYExporter().parse(root,result=>resolve({blob:new Blob([result],{type:"application/octet-stream"}),ext:"ply",mime:"application/octet-stream"}),{binary:true}));
  }
  if(target==="gltf"||target==="glb"){
    const exporter=new GLTFExporter();
    return new Promise((resolve,reject)=>exporter.parse(root,result=>{
      if(target==="glb") return resolve({blob:new Blob([result],{type:"model/gltf-binary"}),ext:"glb",mime:"model/gltf-binary"});
      resolve({blob:new Blob([JSON.stringify(result)],{type:"model/gltf+json"}),ext:"gltf",mime:"model/gltf+json"});
    },reject,{binary:target==="glb",embedImages:true,onlyVisible:true}));
  }
  throw new Error("The "+target.toUpperCase()+" exporter is not enabled yet. Use OBJ, STL, PLY, GLTF or GLB.");
}
export async function imageTo3D(file,quality="balanced"){
  const bitmap=await createImageBitmap(file);
  const size=quality==="high"?160:quality==="fast"?72:112;
  const canvas=document.createElement("canvas"); canvas.width=size; canvas.height=size;
  const ctx=canvas.getContext("2d",{willReadFrequently:true}); if(!ctx) throw new Error("Image processing is not available in this browser.");
  ctx.drawImage(bitmap,0,0,size,size); bitmap.close();
  const pixels=ctx.getImageData(0,0,size,size).data;
  const geometry=new THREE.BufferGeometry();
  const positions=new Float32Array(size*size*3);
  const indices=[];
  const scale=quality==="high"?1.8:quality==="fast"?1.2:1.5;
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const i=y*size+x, p=i*4;
    const lum=(0.2126*pixels[p]+0.7152*pixels[p+1]+0.0722*pixels[p+2])/255;
    const z=(lum-.5)*scale;
    positions[i*3]=(x/(size-1)-.5)*4;
    positions[i*3+1]=(1-y/(size-1)-.5)*4;
    positions[i*3+2]=z;
  }
  for(let y=0;y<size-1;y++) for(let x=0;x<size-1;x++){
    const i=y*size+x, a=i,b=i+1,c=i+size,d=i+size+1;
    indices.push(a,c,b,b,c,d);
  }
  geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const root=new THREE.Group();
  root.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xb7c4d7,metalness:.08,roughness:.72,side:THREE.DoubleSide})));
  return {object:root,source:"image",engine:"Local image-to-3D relief"};
}
export const browserSupportedInputs=[...localInputs,...cadInputs];
export async function compressModel(object,quality="balanced"){
  const root=object.clone(true);
  const ratio=quality==="high"?.2:quality==="small"?.65:.45;
  let changed=false;
  const jobs=[];
  root.traverse(o=>{
    if(!o.isMesh||!o.geometry?.attributes?.position)return;
    const vertices=o.geometry.attributes.position.count;
    if(vertices<1200)return;
    const target=Math.max(200,Math.floor(vertices*ratio));
    jobs.push((async()=>{
      try{
        const modifier=new SimplifyModifier();
        const next=await modifier.modify(o.geometry,target);
        next.computeVertexNormals();
        o.geometry=next;changed=true;
      }catch{}
    })());
  });
  await Promise.all(jobs);
  const result=await exportModel(root,"glb");
  return {...result,changed};
}
export const browserSupportedOutputs=["obj","stl","ply","gltf","glb"];
