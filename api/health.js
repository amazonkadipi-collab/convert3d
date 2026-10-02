export default async function handler(request,response){
  if(request.method!=="GET"&&request.method!=="HEAD") return response.status(405).json({ok:false,error:"Method not allowed"});
  const started=Date.now();
  try{
    const {default:assimpFactory}=await import("assimpjs");
    const ajs=await assimpFactory();
    const obj="# Convert3D health\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n";
    const list=new ajs.FileList();
    list.AddFile("health.obj",new TextEncoder().encode(obj));
    const result=ajs.ConvertFileList(list,"glb2");
    const converterOk=!!result.IsSuccess()&&result.FileCount()>0;
    if(!converterOk) throw new Error("Assimp WASM self-test failed");
    return response.status(200).json({
      ok:true,
      service:"convert3d-api",
      converter:"Assimp WASM",
      converterSelfTest:"passed",
      serverFallbackOutput:"glb",
      browserOutputs:["obj","stl","ply","gltf","glb","usdz"],
      imageTo3D:"local browser relief generator",
      latencyMs:Date.now()-started,
      time:new Date().toISOString()
    });
  }catch(error){
    return response.status(503).json({ok:false,service:"convert3d-api",converterSelfTest:"failed",error:error instanceof Error?error.message:"Unknown error",latencyMs:Date.now()-started,time:new Date().toISOString()});
  }
}
