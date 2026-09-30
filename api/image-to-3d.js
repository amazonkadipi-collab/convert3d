export const config={api:{bodyParser:false}};
export default async function handler(request,response){
  if(request.method!=="POST") return response.status(405).json({error:"Method not allowed"});
  const base=process.env.IMAGE_TO_3D_API_URL;
  if(!base) return response.status(503).json({error:"Image-to-3D provider is not configured."});
  try{
    const chunks=[]; for await(const chunk of request) chunks.push(chunk); const body=Buffer.concat(chunks);
    const headers={};
    if(process.env.IMAGE_TO_3D_API_KEY) headers.Authorization="Bearer "+process.env.IMAGE_TO_3D_API_KEY;
    if(request.headers["content-type"]) headers["content-type"]=request.headers["content-type"];
    const upstream=await fetch(base,{method:"POST",headers,body});
    response.status(upstream.status);
    const type=upstream.headers.get("content-type"); if(type) response.setHeader("content-type",type);
    const disposition=upstream.headers.get("content-disposition"); if(disposition) response.setHeader("content-disposition",disposition);
    response.send(Buffer.from(await upstream.arrayBuffer()));
  }catch(error){response.status(502).json({error:"Image-to-3D provider request failed.",detail:error instanceof Error?error.message:"Unknown error"});}
}