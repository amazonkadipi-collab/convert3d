import React,{useEffect,useRef,useState} from "react";
import {exportModel,loadModel,compressModel,imageTo3D,browserSupportedOutputs} from "./engine.js";
import ModelCanvas from "./ModelCanvas.jsx";
import {Link,NavLink,Route,Routes,useParams} from "react-router-dom";

const formats=[["step","STEP","STEP CAD"],["stp","STP","STEP CAD"],["sldprt","SLDPRT","SolidWorks Part"],["sldasm","SLDASM","SolidWorks Assembly"],["slddrw","SLDDRW","SolidWorks Drawing"],["obj","OBJ","Wavefront Object"],["fbx","FBX","Autodesk FBX"],["stl","STL","Stereolithography"],["gltf","GLTF","glTF"],["glb","GLB","glTF Binary"],["usd","USD","Universal Scene Description"],["usda","USDA","Universal Scene Description"],["usdc","USDC","Universal Scene Description"],["usdz","USDZ","Universal Scene Description"],["3dm","3DM","Rhino 3DM"],["max","MAX","3ds Max"],["blend","BLEND","Blender 3D"],["skp","SKP","Sketchup"],["dae","DAE","Collada"],["dwg","DWG","AutoCAD DWG"],["dxf","DXF","AutoCAD DXF"],["3ds","3DS","3ds Max 3DS"],["iges","IGES","Initial Graphics Exchange Specification"],["igs","IGS","Initial Graphics Exchange Specification"],["ply","PLY","Stanford Polygon Library"],["vox","VOX","MagicaVoxel"],["mdl","MDL","Quake I"],["3mf","3MF","3D Manufacturing Format"],["brep","BREP","Boundary Representation"],["smd","SMD","Valve Model"],["lwo","LWO","LightWave"],["bvh","BVH","Biovision BVH"],["x","X","DirectX X"],["rbxm","RBXM","Roblox Model File"],["rbxl","RBXL","Roblox Level File"],["b3d","B3D","BlitzBasic 3D"],["off","OFF","Object File Format"],["md3","MD3","Quake III Mesh"],["ase","ASE","3ds Max ASE"],["scn","SCN","TrueSpace"],["md2","MD2","Quake II"],["ac3d","AC3D","AC3D"],["ac","AC","AC3D"],["ms3d","MS3D","Milkshape 3D"],["cob","COB","TrueSpace"],["vta","VTA","Valve Model"],["raw","RAW","PovRAY Raw"],["ter","TER","Terragen Terrain"],["hmb","HMB","TrueSpace HMB"],["xgl","XGL","XGL"],["zgl","ZGL","XGL"],["lws","LWS","LightWave Scene"],["csm","CSM","CharacterStudio Motion"],["irrmesh","IRRMESH","Irrlicht Mesh"],["irr","IRR","Irrlicht Scene"],["iqm","IQM","Inter-Quake Model"],["mdc","MDC","Return to Castle Wolfenstein"],["md5","MD5","Doom 3"],["m3d","M3D","Model 3D"],["ogex","OGEX","Open Game Engine Exchange"],["x3d","X3D","Extensible 3D"],["q3s","Q3S","Quick3D"],["nff","NFF","Neutral File Format"],["ndo","NDO","Izware Nendo"],["amf","AMF","Additive Manufacturing File Format"],["ifc","IFC","Industry Foundation Classes"],["gcode","GCODE","G-Code"],["nc","NC","G-Code"],["3d","3D","Unreal"],["xml","XML","Mesh XML"],["acc","ACC","ACC"],["amj","AMJ","AMJ"],["ask","ASK","ASK"],["enff","ENFF","ENFF"],["mot","MOT","MOT"],["pmx","PMX","PMX"],["prj","PRJ","PRJ"],["q3o","Q3O","Q3O"],["sib","SIB","SIB"],["uc","UC","UC"],["lxo","LXO","Modo"]];

const outputs=["obj","stl","ply","gltf","glb","usdz"];
const verifiedInputs=new Set(["obj","stl","ply","fbx","gltf","glb","dae","3mf","3ds","usd","usda","usdc","usdz","step","stp","iges","igs","brep"]);
const popularPairs=[["step","obj"],["stp","obj"],["sldprt","obj"],["amf","obj"],["ifc","stp"],["obj","fbx"],["fbx","glb"],["stl","glb"],["gcode","stl"],["3dm","obj"]];
const sampleModels=[
  ["Damaged Helmet","https://convert3d.vercel.app/_next/static/media/damaged-helmet.aed11d90.png"],
  ["CAD Motor","https://convert3d.vercel.app/_next/static/media/cad-motor.c9d60b7c.png"],
  ["Submarine","https://convert3d.vercel.app/_next/static/media/submarine.f0e16e26.png"]
];

const label=k=>formats.find(x=>x[0]===k)?.[1]||String(k||"").toUpperCase();
const metaName=k=>formats.find(x=>x[0]===k)?.[2]||"3D file";
const isKnownFormat=k=>verifiedInputs.has(k);
const isKnownPair=(a,b)=>isKnownFormat(a)&&isKnownFormat(b)&&a!==b;

function useSEO(title,description,path){
  useEffect(()=>{
    const base="https://converts3d.vercel.app";
    const canonicalUrl=base+(path||window.location.pathname);
    document.documentElement.lang="en";
    document.title=title;
    const meta=(name,content,property=false)=>{
      const selector='meta['+(property?'property':'name')+'="'+name+'"]';
      let el=document.head.querySelector(selector);
      if(!el){
        el=document.createElement("meta");
        if(property) el.setAttribute("property",name); else el.setAttribute("name",name);
        document.head.appendChild(el);
      }
      el.setAttribute("content",content);
    };
    const link=(rel,href)=>{
      let el=[...document.head.querySelectorAll("link")].find(x=>x.rel===rel&&x.dataset.seoLink==="true");
      if(!el){el=document.createElement("link");el.rel=rel;el.dataset.seoLink="true";document.head.appendChild(el)}
      el.href=href;
    };
    meta("description",description);
    meta("robots","index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    meta("googlebot","index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    meta("author","Convert3D");
    meta("application-name","Convert3D");
    meta("theme-color","#ffffff");
    meta("og:type","website",true);
    meta("og:site_name","Convert3D",true);
    meta("og:title",title,true);
    meta("og:description",description,true);
    meta("og:url",canonicalUrl,true);
    meta("og:locale","en_US",true);
    meta("twitter:card","summary_large_image");
    meta("twitter:title",title);
    meta("twitter:description",description);
    link("canonical",canonicalUrl);
    link("describedby",base+"/llms.txt");
    document.head.querySelectorAll('script[data-convert3d-seo="true"]').forEach(x=>x.remove());
    const jsonLd=path==="/"
      ? [
          {"@context":"https://schema.org","@type":"WebSite","@id":base+"#website","url":base+"/","name":"Convert3D","description":"Free online 3D model conversion tools.","inLanguage":"en"},
          {"@context":"https://schema.org","@type":"SoftwareApplication","@id":base+"#software","name":"Convert3D","url":base+"/","applicationCategory":"MultimediaApplication","operatingSystem":"Web Browser","description":"Free online 3D model converter for popular CAD, mesh and 3D formats.","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}
        ]
      : [{"@context":"https://schema.org","@type":"WebPage","@id":canonicalUrl+"#webpage","url":canonicalUrl,"name":title,"description":description,"isPartOf":{"@id":base+"#website"},"inLanguage":"en"}];
    jsonLd.forEach(data=>{
      const script=document.createElement("script");
      script.type="application/ld+json";
      script.dataset.convert3dSeo="true";
      script.textContent=JSON.stringify(data);
      document.head.appendChild(script);
    });
  },[title,description,path]);
}

function Brand(){
  return <Link className="brand" to="/" aria-label="Convert 3D home">
    <span className="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
    <span>Convert<br/><b>3D</b></span>
  </Link>
}

function Header(){
  return <header className="site-header">
    <div className="wrap nav">
      <Brand/>
    </div>
  </header>
}
function Footer(){
  return <footer className="footer">
    <div className="wrap footer-grid">
      <div><b>Company</b><Link to="/posts">Blog</Link><Link to="/about">About</Link></div>
      <div><b>Tools &amp; API</b><Link to="/convert">Convert</Link><Link to="/compress">Compress</Link><Link to="/render-model">Render</Link><Link to="/view">View</Link><Link to="/developer-api">Developer API</Link></div>
      <div><b>Community</b><a href="https://discord.gg/Q4CjpPMUHu" target="_blank" rel="noreferrer">Discord</a></div>
    </div>
    <div className="wrap footer-bottom"><span>© 2026 Convert3D</span><span><Link to="/about/privacy">Privacy</Link><Link to="/about/terms">Terms</Link></span></div>
  </footer>
}
function Uploader({accept,onFiles,labelText="Select 3D model files"}){
  const ref=useRef(null); const [drag,setDrag]=useState(false);
  const add=f=>{const a=[...f]; if(a.length) onFiles(a)};
  return <div className={"uploader "+(drag?"drag":"")}
    onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
    onDrop={e=>{e.preventDefault();setDrag(false);add(e.dataTransfer.files)}}>
    <input hidden ref={ref} type="file" multiple accept={accept||[...verifiedInputs].map(f=>"."+f).join(",")} onChange={e=>add(e.target.files)}/>
    <button className="select-btn upload-select" type="button" onClick={e=>{e.stopPropagation();ref.current?.click()}}>{labelText}</button>
    <p>or drop files</p>
    <div className="privacy-badge">✓ Privacy Protected <span>• WebMCP ready</span></div>
  </div>
}

function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

async function serverConvert(file,output){
  const form=new FormData(); form.append("file",file,file.name); form.append("output",output);
  const response=await fetch("/api/convert",{method:"POST",body:form});
  if(!response.ok) throw new Error((await response.json().catch(()=>({}))).error||"This conversion is not available in the current engine.");
  const format=response.headers.get("x-convert3d-result-format")||output;
  return {blob:new Blob([await response.arrayBuffer()],{type:response.headers.get("content-type")||"application/octet-stream"}),format,processing:response.headers.get("x-convert3d-processing")||"server"};
}

function Converter({from,to,showFormatLine=true}){
  const [files,setFiles]=useState([]); const [out,setOut]=useState(to||"obj"); const [busy,setBusy]=useState(false); const [object,setObject]=useState(null); const [engine,setEngine]=useState(""); const [error,setError]=useState(""); const [done,setDone]=useState(0);
  const allowedOutputs=browserSupportedOutputs.includes("usdz")?[...browserSupportedOutputs]:[...browserSupportedOutputs,"usdz"];
  const selectFiles=async next=>{setFiles(next);setDone(0);setError("");setObject(null);setEngine("");if(next[0]){try{const r=await loadModel(next[0]);setObject(r.object);setEngine(r.engine)}catch(e){setError(e?.message||"Unable to read this file.")}}};
  const run=async()=>{
    if(!files.length)return;
    setBusy(true);setError("");setDone(0);
    try{
      for(const file of files){
        const ext=file.name.split(".").pop()?.toLowerCase()||"";
        if(ext===out){downloadBlob(file,file.name);setDone(n=>n+1);continue}
        try{
          const r=object&&files[0]===file?{object,source:ext,engine}:await loadModel(file);
          const result=await exportModel(r.object,out); const base=file.name.replace(/\.[^.]+$/,"");
          downloadBlob(result.blob,base+"."+result.ext); setDone(n=>n+1);
        }catch(localError){
          if(out!=="glb") throw localError;
          const server=await serverConvert(file,out);
          downloadBlob(server.blob,file.name.replace(/\.[^.]+$/,"")+"."+server.format);
          setEngine(server.processing); setDone(n=>n+1);
        }
      }
    }catch(e){setError(e?.message||"Conversion failed.");}
    finally{setBusy(false)}
  };
  return <div className="converter-card">
    {showFormatLine&&<div className="format-line"><b>{from?label(from):"Any 3D model"}</b><span>→</span><b>{label(out)}</b></div>}
    <Uploader onFiles={selectFiles}/>
    {object&&<ModelCanvas object={object}/>}
    {files.length>0&&<div className="file-list">{files.map((f,i)=><div className="file-row" key={f.name+i}><span>{f.name} · {(f.size/1048576).toFixed(2)} MB</span><button type="button" onClick={()=>selectFiles(files.filter((_,n)=>n!==i))}>×</button></div>)}</div>}
    {files.length>0&&<div className="converter-controls">
      <label>Convert to<select value={out} onChange={e=>setOut(e.target.value)}>
        {outputs.map(k=><option key={k} value={k} disabled={!allowedOutputs.includes(k)}>{label(k)}{allowedOutputs.includes(k)?"":" — unavailable in current browser engine"}</option>)}
      </select></label>
      <button className="select-btn action" disabled={!files.length||busy} onClick={run}>{busy?"Converting…":"Convert Model"}</button>
    </div>}
    {engine&&<div className="engine-note">{engine}</div>}
    {error&&<div className="error-box">{error}</div>}
    {done>0&&done===files.length&&!error&&<div className="success-box">✓ Conversion complete — your file is ready.</div>}
  </div>
}

function Home(){
  useSEO("Convert 3D models online - free and secure","Free, secure browser-first 3D model conversion with verified local and server fallback paths.","/");
  return <>
    <main className="home">
      <section className="hero">
        <div className="wrap hero-layout">
          <div className="hero-copy">
            <h1>Convert 3D models</h1>
            <p>Free, secure and browser-first. Supported conversions run locally; GLB can use a clearly reported server fallback when a browser parser cannot import the source.</p>
            <div className="hero-actions">
              <Link className="primary-btn" to="/convert">Convert Model</Link>
              <a className="secondary-btn" href="https://www.youtube.com/watch?v=ZTWtnd_4eVM" target="_blank" rel="noreferrer">Watch a video</a>
            </div>
          </div>
          <div className="hero-tool">
            <Converter showFormatLine={false}/>
          </div>
        </div>
      </section>

      <section className="trust-section" aria-label="Built with real conversion engines">
        <div className="wrap">
          <div className="trust-title">Browser-first 3D conversion powered by <strong>Three.js</strong>, <strong>Assimp</strong> and <strong>OpenCascade WASM</strong></div>
          <div className="trust-marquee factual-tools">
            <div className="trust-track">
              {["Three.js","Assimp WASM","OpenCascade WASM","GLTFExporter","USDZExporter","OBJExporter","STLExporter","PLYExporter"].concat(["Three.js","Assimp WASM","OpenCascade WASM","GLTFExporter","USDZExporter","OBJExporter","STLExporter","PLYExporter"]).map((name,i)=><span key={name+i} className="engine-badge">{name}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section light">
        <div className="wrap">
          <div className="section-top">
            <div><h2>Popular Formats</h2></div>
            <Link to="/convert">See all</Link>
          </div>
          <div className="format-grid">
            {[
              ["step","step","step"],["stp","stp","stp"],["sldprt","sldprt","sldprt"],["amf","amf","amf"],
              ["ifc","",".ifc"],["obj","obj","obj"],["fbx","",".fbx"],["stl","stl","stl"],
              ["gcode","gcode","gcode"],["nc","nc","nc"],["3dm","",".3dm"],["glb","",".glb"],
              ["usd","",".usd"],["usda","",".usda"],["usdz","",".usdz"],["usdc","",".usdc"],
              ["sldasm","sldasm","sldasm"],["max","",".max"]
            ].map(([k,top,bottom])=><Link to={"/convert/"+k} key={k} className="format-item"><span>{top||" "}</span><b>{bottom}</b></Link>)}
          </div>
          <div className="copy-block">
            <h3>Free online 3D model converter software</h3>
            <p>Our online 3D model converter is free and browser-first. Verified local conversions run in your browser. When a source needs the GLB server fallback, the interface reports that server processing is being used.</p>
            <p>That also means Convert3D works on any platform, including Windows, Mac, Linux and ChromeOS and browsers like Chrome, Safari, Firefox, Edge and Brave.</p>
            <p>Browser export is available for OBJ, STL, PLY, GLTF, GLB and USDZ. The verified source catalog is limited to formats with an implemented browser parser in this build.</p>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <div className="wrap">
          <div className="section-heading">
            <h2>How to convert 3D models</h2>
          </div>
          <div className="steps-grid">
            {[
              ["Drag in your model","Scroll to the top of this page, or choose a specific converter. Drag in your 3D model file.","https://convert3d.vercel.app/_next/image?q=75&url=%2FStep01.png&w=640"],
              ["Preview in full 3D","We instantly preview your model in 3D. You can rotate, zoom and pan around to inspect it and make sure you have the right file.","https://convert3d.vercel.app/_next/image?q=75&url=%2FStep02.png&w=640"],
              ["Pick an export format","Choose the format to convert to. The file will immediately start downloading.","https://convert3d.vercel.app/_next/image?q=75&url=%2FStep03.png&w=640"]
            ].map(([t,d,img],i)=><div className="step-item" key={t}>
              <div className="step-visual photo"><img src={img} alt={"Step "+(i+1)} loading="lazy" onError={e=>{e.currentTarget.style.display="none"}}/></div>
              <span>Step {i+1}</span><h3>{t}</h3><p>{d}</p>
            </div>)}
          </div>     </div>
      </section>

      <PopularConversions/>

      <section className="privacy-section">
        <div className="wrap privacy-grid">
          <div>
            <h2>Engineered for privacy</h2>
            <p>3D models are often key to your business. We believe that means you should be in control of them and do everything to keep them private.</p>
          </div>
          <div className="privacy-cards">
            <div><b>Nothing uploaded</b><p>Model conversion happens locally on your machine. Nothing is uploaded to our servers.</p></div>
            <div><b>No login required</b><p>Your conversions are 100% anonymous. No sign up, no credit card.</p></div>
            <div><b>No PII tracking</b><p>We track anonymous usage data and statistics so we know what to improve, but nothing that can be used to identify you.</p></div>
          </div>
        </div>
      </section>

      <section className="api-section">
        <div className="wrap api-box">
          <div>
            <h2>Convert3D API</h2>
            <p>Integrate 3D model conversion into your applications. Convert between 1000+ format combinations programmatically with our reliable REST API.</p>
            <div className="api-actions"><Link className="primary-btn" to="/developer-api">Learn More</Link><Link className="secondary-btn" to="/developer-api">Get Started</Link></div>
          </div>
          <div className="api-points">{["Multipart REST endpoint","GLB server fallback","Browser-first processing","Explicit capability errors"].map(x=><span key={x}>✓ {x}</span>)}</div>
        </div>
      </section>

      <section className="faq-section">
        <div className="wrap narrow">
          <h2>FAQ</h2>
          <p className="faq-intro">Read more about Convert3D or get in touch on hello@convert3d.org</p>
          {[["How does Convert3D work?","Drop your model into the converter, preview supported files, choose an output, and download the result."],["How can I be sure that my model doesn't leave my computer?","For supported local conversions, the browser engine handles the file locally. Fallback/server workflows are clearly treated as server processing."],["Why is it free and where are the ads?","The core browser workflow is free and there are no paid checkout flows in this deployment."],["What hardware is required to run Convert3D?","The workload depends on model size and browser capabilities. Large meshes can require more memory and processing time."],["Where does my 3D model go?","Supported local conversions stay in the browser; server fallback routes process files on the configured server."]].map(([q,ans])=><details key={q}><summary>{q}</summary><p>{ans}</p></details>)}
        </div>
      </section>
    </main>
  </>
}

function PopularConversions(){
  const sources=["step","stp","sldprt","amf","ifc","obj","fbx","stl"];
  return <section className="popular-section"><div className="wrap"><div className="section-top"><div><span className="eyebrow">POPULAR CONVERSIONS</span><h2>Popular Conversions</h2></div><Link to="/all">See all →</Link></div>{sources.map(source=><div className="popular-row" key={source}><Link className="source-format" to={"/convert/"+source}><b>{label(source)}</b><span>{source}.{source}</span></Link><div><h3>Convert {label(source)} file to →</h3><div className="output-links">{outputs.map(target=><Link key={target} to={"/"+source+"-to-"+target}>{label(target)}</Link>)}</div></div></div>)}</div></section>
}

function Convert(){
  useSEO("3D Model Converter Online (Free) | Convert 3D","Convert your 3D models to multiple popular formats online. Preview supported files before download.","/convert");
  return <PageShell title="3D Model Converter" subtitle="Convert your 3D models to multiple formats (OBJ, FBX, USDZ, GLB, GLTF, and more) online, free, and safe."><Converter/><section className="format-directory"><h2>Supported file formats</h2>{formats.map(([k,n,d])=><Link key={k} to={"/convert/"+k}><b>{k}</b><span>{n} Converter</span><em>{d}</em></Link>)}</section></PageShell>
}

function FormatPage(){
  const {format}=useParams(); if(!isKnownFormat(format)) return <NotFound/>;
  const name=label(format);
  useSEO(name+" Converter Online (Free)","Convert "+metaName(format)+" files online. Explore supported destination formats and preview your model.","/convert/"+format);
  return <PageShell title={name+" Converter"} subtitle={"Convert "+metaName(format)+" files online and choose a compatible output format."}><Converter from={format}/><section className="format-copy"><h2>About {name}</h2><p>{name} is used in many 3D workflows. Choose the destination based on the application you are sending the file to, then verify geometry, scale, materials, textures and metadata.</p><div className="output-links large">{outputs.filter(x=>x!==format).map(x=><Link key={x} to={"/"+format+"-to-"+x}>{name} → {label(x)}</Link>)}</div></section></PageShell>
}

function Pair(){
  const {pair}=useParams(); const parts=String(pair||"").split("-to-"); const from=parts[0],to=parts[1];
  if(!isKnownPair(from,to) || !verifiedInputs.has(from) || !outputs.includes(to)) return <NotFound/>;
  useSEO(label(from)+" to "+label(to)+" Converter Online (Free)","Convert "+label(from)+" files to "+label(to)+" online. Preview the supported source before downloading.","/"+pair);
  return <PageShell title={label(from)+" to "+label(to)+" Converter"} subtitle={"Convert a "+metaName(from)+" file to "+metaName(to)+" when this output is enabled by the current browser engine."}><Converter from={from} to={to}/><section className="pair-copy"><div><h2>Convert {label(from)} to {label(to)}</h2><p>Keep an original backup. Preview the source model first and check geometry, materials, textures, units and metadata in the target application after conversion.</p></div><div className="compat-card"><b>Format path</b><span>{from} → {to}</span><small>{browserSupportedOutputs.includes(to)?"Browser exporter available":"This catalog path is shown for discovery; the current browser build may not export this target."}</small></div></section></PageShell>
}

function PageShell({title,subtitle,children}){
  return <><section className="inner-hero"><div className="wrap"><Link className="crumb" to="/">Home</Link><h1>{title}</h1><p>{subtitle}</p></div></section><main className="wrap inner-main">{children}</main></>
}

function Tool({kind}){
  const config={
    compress:["Compress 3D models","Reduce model complexity and export a compact GLB in the browser.","Compress 3D Models"],
    render:["Render 3D models","Create a PNG preview from a model in the browser.","3D Model Renderer"],
    view:["View 3D models","Inspect supported assets with orbit controls and wireframe mode.","3D Model Viewer"]
  }[kind];
  useSEO(config[0]+" | Convert 3D",config[1],"/"+(kind==="render"?"render-model":kind));
  if(kind==="compress") return <PageShell title={config[2]} subtitle={config[1]}><CompressPanel/></PageShell>;
  return <PageShell title={config[2]} subtitle={config[1]}><ViewerPanel renderMode={kind==="render"}/></PageShell>
}

function ViewerPanel({renderMode=false}){
  const [files,setFiles]=useState([]),[object,setObject]=useState(null),[error,setError]=useState(""),[wireframe,setWireframe]=useState(false),[capture,setCapture]=useState(null);
  const choose=async list=>{setFiles(list);setObject(null);setError("");setCapture(null);try{if(list[0]){const r=await loadModel(list[0]);setObject(r.object)}}catch(e){setError(e?.message||"Unable to load this model.")}};
  const save=()=>{if(!capture)return;downloadBlob(capture(),(files[0]?.name||"model").replace(/\.[^.]+$/,"")+".png")};
  return <div className="tool-card"><Uploader onFiles={choose}/>{object&&<ModelCanvas object={object} wireframe={wireframe} onReady={setCapture}/>}<div className="tool-buttons">{!renderMode&&<button className="secondary-btn" onClick={()=>setWireframe(v=>!v)}>{wireframe?"Solid mode":"Wireframe"}</button>}{renderMode&&<button className="primary-btn" onClick={save}>Download PNG</button>}</div>{error&&<div className="error-box">{error}</div>}</div>
}

function CompressPanel(){
  const [files,setFiles]=useState([]),[object,setObject]=useState(null),[quality,setQuality]=useState("balanced"),[busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState(null);
  const choose=async list=>{setFiles(list);setObject(null);setResult(null);setError("");try{if(list[0]){const r=await loadModel(list[0]);setObject(r.object)}}catch(e){setError(e?.message||"Unable to load this model.")}};
  const run=async()=>{if(!object)return;setBusy(true);setError("");setResult(null);try{setResult(await compressModel(object,quality))}catch(e){setError(e?.message||"Compression failed.")}finally{setBusy(false)}};
  return <div className="tool-card"><Uploader onFiles={choose}/>{object&&<ModelCanvas object={object}/>}<div className="converter-controls"><label>Compression level<select value={quality} onChange={e=>setQuality(e.target.value)}><option value="high">High quality</option><option value="balanced">Balanced</option><option value="small">Smaller file</option></select></label><button className="primary-btn" disabled={!object||busy} onClick={run}>{busy?"Compressing…":"Compress to GLB"}</button></div>{error&&<div className="error-box">{error}</div>}{result&&<div className="success-box">{result.changed?"✓ Geometry simplified and GLB ready.":"✓ GLB exported; this model was already below the simplification threshold."} <button className="text-link" onClick={()=>downloadBlob(result.blob,(files[0]?.name||"model").replace(/\.[^.]+$/,"")+".glb")}>Download</button></div>}</div>
}

function ImageTo3D(){
  const [img,setImg]=useState(null),[quality,setQuality]=useState("balanced"),[busy,setBusy]=useState(false),[error,setError]=useState(""),[object,setObject]=useState(null),[result,setResult]=useState(null);
  useSEO("Image to 3D | Convert 3D","Create a lightweight image-derived 3D relief locally in your browser.","/image-to-3d");
  const generate=async()=>{if(!img)return;setBusy(true);setError("");setResult(null);try{const r=await imageTo3D(img,quality);setObject(r.object);setResult((await exportModel(r.object,"glb")).blob)}catch(e){setError(e?.message||"Image-to-3D failed.")}finally{setBusy(false)}};
  return <PageShell title="Image to 3D relief" subtitle="Turn a reference image into a lightweight 3D relief locally in your browser."><div className="tool-card"><Uploader accept="image/*" labelText="Select a reference image" onFiles={f=>{setImg(f[0]);setError("");setResult(null);setObject(null)}}/>{img&&<div className="success-box">✓ Ready: {img.name}</div>}{object&&<ModelCanvas object={object}/>}<div className="converter-controls"><label>Quality<select value={quality} onChange={e=>setQuality(e.target.value)}><option value="fast">Fast</option><option value="balanced">Balanced</option><option value="high">High detail</option></select></label><button className="primary-btn" disabled={!img||busy} onClick={generate}>{busy?"Generating…":"Generate 3D"}</button></div>{error&&<div className="error-box">{error}</div>}{result&&<div className="success-box">✓ 3D relief ready. <button className="text-link" onClick={()=>downloadBlob(result,(img?.name||"model").replace(/\.[^.]+$/,"")+".glb")}>Download GLB</button></div>}</div></PageShell>
}


function API(){
  useSEO("Convert3D API","Developer API information for integrations using the repository conversion endpoint.","/developer-api");
  return <PageShell title="Convert3D API" subtitle="Integrate supported conversion workflows into your own applications."><div className="api-page-grid"><div className="tool-card"><h2>POST /api/convert</h2><pre>multipart/form-data{String.fromCharCode(10)}file = model.step{String.fromCharCode(10)}output = glb</pre><p>Use the endpoint for formats supported by the bundled server engine. Validate the response headers and do not assume unsupported outputs are available.</p></div><div className="api-copy"><h2>Built for developers</h2><p>Simple REST endpoint with a real GLB fallback, health check, and the same browser-first format catalog used by the web interface.</p><Link className="primary-btn" to="/convert">Get Started</Link></div></div></PageShell>
}

const posts=[["dwg-solid","From DWG to solid workflows"],["blender-gltf","Blender to glTF for the web"],["glb-size","How to reduce GLB size"],["sharing-3d","Sharing 3D models safely"]];
function Posts(){useSEO("3D workflow guides","Practical notes about formats, conversion, viewing and delivery.","/posts");return <PageShell title="3D workflow guides" subtitle="Practical notes about formats, conversion, viewing and delivery."><div className="post-grid">{posts.map(([s,t])=><Link className="post-card" to={"/posts/"+s} key={s}><span className="eyebrow">GUIDE</span><h2>{t}</h2><p>Practical guidance for a common 3D workflow.</p><b>Read article →</b></Link>)}</div></PageShell>}
function Post(){const {slug}=useParams();const p=posts.find(x=>x[0]===slug);if(!p)return <NotFound/>;useSEO(p[1]+" | Convert 3D","A practical note for creators working across multiple 3D tools and formats.","/posts/"+slug);return <article className="article"><Link className="crumb" to="/posts">Blog</Link><span className="eyebrow">GUIDE</span><h1>{p[1]}</h1><p>Choose the format based on the final software or delivery target. After conversion, inspect geometry, scale, materials, textures and metadata instead of assuming every feature maps perfectly.</p><h2>Suggested workflow</h2><ol><li>Keep an untouched source copy.</li><li>Choose a destination based on the actual target application.</li><li>Preview the result before distribution.</li><li>Record important settings for repeatable exports.</li></ol></article>}

function All(){useSEO("Available 3D conversion paths | Convert 3D","Browse the current 3D format and conversion-path catalog.","/all");return <PageShell title="Available 3D conversion paths" subtitle="Choose a source format and one of the currently supported export formats."><div className="all-grid">{formats.map(([key,name])=><section className="all-block" key={key}><div><h2>{name}</h2><span>{key}</span></div><p>Convert {name} file to →</p><div className="output-links">{outputs.filter(x=>x!==key).map(x=><Link key={x} to={"/"+key+"-to-"+x}>{label(x)}</Link>)}</div></section>)}</div></PageShell>}

function About(){
  const {section}=useParams();
  if(section==="privacy"){useSEO("Privacy | Convert 3D","Privacy information for the Convert3D web app.","/about/privacy");return <article className="article"><Link className="crumb" to="/about">About</Link><h1>Privacy</h1><p>Supported local conversions run in your browser. Server fallback endpoints should be treated as server processing. Do not state that a file never leaves the device when the selected workflow uses a server endpoint.</p><h2>Data handling</h2><p>The repository does not require an account to use the core converter. Keep this page aligned with the actual deployment, analytics, and server configuration.</p></article>}
  if(section==="terms"){useSEO("Terms | Convert 3D","Terms of use for the Convert3D web app.","/about/terms");return <article className="article"><Link className="crumb" to="/about">About</Link><h1>Terms</h1><p>Use the service only with files you are permitted to process. Keep backups of original production assets.</p><h2>Acceptable use</h2><p>Do not upload content that you do not have permission to process, and do not rely on conversion for safety-critical or legally controlled workflows without independent verification.</p></article>}
  useSEO("About Convert 3D","Learn how the Convert3D browser-first toolkit works.","/about");
  return <PageShell title="About Convert3D" subtitle="A browser-first toolkit for common 3D asset workflows."><div className="about-grid"><div><h2>What is this?</h2><p>Convert3D is a browser-first toolkit for moving between 3D file formats, previewing models, compressing meshes, and documenting common workflows.</p><h2>Can you see my files?</h2><p>Local conversion engines process supported files on your device. When a deployment uses a server fallback, the file is sent to that endpoint instead.</p></div><div className="about-card"><h3>Core principles</h3><p>Clear format intent, privacy-aware processing, fast interfaces, and useful documentation.</p></div></div></PageShell>
}

function Login(){
  useSEO("Log in | Convert 3D","Login is optional. Convert3D's free browser tools do not require an account.","/login");
  return <PageShell title="Log in" subtitle="No account is required to use the free browser tools.">
    <div className="tool-card">
      <h2>Continue without an account</h2>
      <p>Convert, compress, render and view supported 3D files without signing in.</p>
      <Link className="primary-btn" to="/convert">Convert Model</Link>
    </div>
  </PageShell>
}
function NotFound(){useSEO("Page not found | Convert 3D","The requested Convert3D page does not exist.");return <main className="wrap not-found"><h1>Page not found</h1><Link className="primary-btn" to="/">Back home</Link></main>}

export default function App(){
  return <div className="app"><Header/><Routes>
    <Route path="/" element={<Home/>}/><Route path="/convert" element={<Convert/>}/><Route path="/all" element={<All/>}/>
    <Route path="/convert/:format" element={<FormatPage/>}/><Route path="/:pair/app" element={<Pair/>}/><Route path="/:pair" element={<Pair/>}/>
    <Route path="/compress" element={<Tool kind="compress"/>}/><Route path="/render-model" element={<Tool kind="render"/>}/><Route path="/view" element={<Tool kind="view"/>}/>
    <Route path="/image-to-3d" element={<ImageTo3D/>}/><Route path="/login" element={<Login/>}/><Route path="/developer-api" element={<API/>}/>
    <Route path="/posts" element={<Posts/>}/><Route path="/posts/:slug" element={<Post/>}/><Route path="/about/:section?" element={<About/>}/><Route path="*" element={<NotFound/>}/>
  </Routes><Footer/></div>
}
