export const config={api:{bodyParser:false}};
export default async function handler(request,response){
  if(request.method!=="POST") return response.status(405).json({error:"Method not allowed"});
  const base=process.env.IMAGE_TO_3D_API_URL;
  if(!base) return response.status(503).json({error:"Image-to-3D provider is not configured."});
  try{
    const headers={};
    if(process.env.IMAGE_TO_3D_API_KEY) headers.Authorization="Bearer "+process.env.IMAGE_TO_3D_API_KEY;
    headers["content-type"]=request.headers["content-type"]||"application/octet-stream";
    const upstream=await fetch(base,{method:"POST",headers,body:request});
    response.status(upstream.status);
    response.setHeader("content-type",upstream.headers.get("content-type")||"application/octet-stream");
    response.send(Buffer.from(await upstream.arrayBuffer()));
  }catch(error){response.status(502).json({error:"Image-to-3D provider request failed.",detail:error instanceof Error?error.message:"Unknown error"});}
}