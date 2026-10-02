export const config={api:{bodyParser:false}};
export default async function handler(request,response){
  if(request.method!=="POST") return response.status(405).json({error:"Method not allowed"});
  try{
    const chunks=[]; for await(const chunk of request) chunks.push(chunk); const body=Buffer.concat(chunks);
    const inputType=request.headers["content-type"]||"";
    if(!inputType.includes("multipart/form-data")) return response.status(400).json({error:"Expected multipart/form-data with file and output fields."});
    const {default:assimpFactory}=await import("assimpjs");
    const ajs=await assimpFactory();
    const contentType=inputType;
    const boundary=/boundary=([^;]+)/i.exec(contentType)?.[1];
    if(!boundary) return response.status(400).json({error:"Multipart boundary missing."});
    const parsed=parseMultipart(body,boundary);
    const filePart=parsed.file;
    const output=(parsed.output||"").trim().toLowerCase();
    if(!filePart) return response.status(400).json({error:"No file field supplied."});
    if(output!=="glb") return response.status(400).json({error:"Server fallback currently supports GLB only. Other outputs are generated locally in the browser."});
    const list=new ajs.FileList();
    list.AddFile(filePart.filename||"model.bin",new Uint8Array(filePart.data));
    const result=ajs.ConvertFileList(list,"glb2");
    if(!result.IsSuccess()||result.FileCount()===0) return response.status(422).json({error:"Assimp WASM could not import this file.",code:String(result.GetErrorCode?.()||"unknown")});
    const out=result.GetFile(0).GetContent();
    response.status(200); response.setHeader("content-type","model/gltf-binary"); response.setHeader("x-convert3d-result-format","glb"); response.setHeader("x-convert3d-processing","free-server-assimp-wasm");
    response.send(Buffer.from(out));
  }catch(error){response.status(502).json({error:"Conversion failed.",detail:error instanceof Error?error.message:"Unknown error"});}
}
function parseMultipart(body,boundary){
  const b=Buffer.from("--"+boundary); const end=Buffer.from("--"+boundary+"--"); const parts=[]; let pos=0;
  while(pos<body.length){let s=body.indexOf(b,pos);if(s<0)break;s+=b.length;if(body.slice(s,s+2).equals(Buffer.from("--")))break;if(body.slice(s,s+2).equals(Buffer.from("\r\n")))s+=2;const e=body.indexOf(b,s);if(e<0)break;let part=body.slice(s,e);if(part.slice(-2).equals(Buffer.from("\r\n")))part=part.slice(0,-2);const split=part.indexOf(Buffer.from("\r\n\r\n"));if(split<0){pos=e;continue;}const headers=part.slice(0,split).toString("utf8");const data=part.slice(split+4);const name=/name="([^"]+)"/i.exec(headers)?.[1];const filename=/filename="([^"]+)"/i.exec(headers)?.[1];parts.push({name,filename,data});pos=e;}
  return {file:parts.find(p=>p.name==="file"),output:parts.find(p=>p.name==="output")?.data.toString("utf8"),parts};
}