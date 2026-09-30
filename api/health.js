export default async function handler(request,response){
  response.status(200).json({ok:true,service:"convert3d-api",time:new Date().toISOString(),converterConfigured:Boolean(process.env.CONVERTER_API_URL),imageTo3DConfigured:Boolean(process.env.IMAGE_TO_3D_API_URL)});
}