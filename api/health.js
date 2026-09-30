export default async function handler(request,response){
  response.status(200).json({
    ok:true,
    service:"convert3d-api",
    time:new Date().toISOString(),
    free:true,
    converter:"bundled Assimp WASM fallback",
    imageTo3D:"local browser engine"
  });
}
