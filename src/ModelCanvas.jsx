import React,{useEffect,useRef} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

export default function ModelCanvas({object}){
  const host=useRef(null);
  useEffect(()=>{
    if(!host.current||!object)return;
    const el=host.current;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x07101a);
    const camera=new THREE.PerspectiveCamera(45,el.clientWidth/Math.max(el.clientHeight,1),0.01,100000);
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(el.clientWidth,el.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.dampingFactor=.08;
    scene.add(new THREE.HemisphereLight(0xffffff,0x223344,2.2));
    const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(4,8,6);scene.add(key);
    const fill=new THREE.DirectionalLight(0x9ec4ff,1.4);fill.position.set(-5,2,-4);scene.add(fill);
    const root=object.clone(true);
    root.traverse(o=>{if(o.isMesh&&o.material?.transparent)o.material.depthWrite=true});
    scene.add(root);
    const box=new THREE.Box3().setFromObject(root);
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const radius=Math.max(size.x,size.y,size.z,1);
    camera.position.copy(center).add(new THREE.Vector3(radius*1.7,radius*1.2,radius*1.7));
    camera.near=Math.max(radius/1000,.001);camera.far=radius*100;
    camera.lookAt(center);
    controls.target.copy(center);controls.update();
    let raf=0;
    const frame=()=>{raf=requestAnimationFrame(frame);controls.update();renderer.render(scene,camera)};
    const resize=()=>{const w=el.clientWidth,h=Math.max(el.clientHeight,1);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
    window.addEventListener("resize",resize);frame();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);controls.dispose();renderer.dispose();el.replaceChildren();root.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()})};
  },[object]);
  return <div ref={host} className="model-canvas"><div className="viewer-badge">3D Preview · local</div></div>;
}