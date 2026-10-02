const { default: handler } = await import("../api/convert.js");

class MockResponse {
  constructor(){ this.statusCodeValue=200; this.headers={}; this.body=null; }
  status(code){ this.statusCodeValue=code; return this; }
  setHeader(name,value){ this.headers[String(name).toLowerCase()]=String(value); }
  json(value){ this.body=Buffer.from(JSON.stringify(value)); return this; }
  send(value){ this.body=Buffer.from(value); return this; }
}

const boundary="----convert3d-smoke";
const obj="# smoke test\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n";
const parts=[
  "--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"smoke.obj\"\r\nContent-Type: text/plain\r\n\r\n",
  obj,
  "\r\n--"+boundary+"\r\nContent-Disposition: form-data; name=\"output\"\r\n\r\nglb",
  "\r\n--"+boundary+"--\r\n"
];
const body=Buffer.from(parts.join(""));
const request={
  method:"POST",
  headers:{"content-type":"multipart/form-data; boundary="+boundary},
  async *[Symbol.asyncIterator](){ yield body; }
};
const response=new MockResponse();
await handler(request,response);

if(response.statusCodeValue!==200) {
  throw new Error("API returned HTTP "+response.statusCodeValue+": "+response.body?.toString());
}
if(response.headers["x-convert3d-result-format"]!=="glb") throw new Error("Missing GLB result header");
if(response.headers["content-type"]!=="model/gltf-binary") throw new Error("Wrong content type");
if(!response.body||response.body.length<100) throw new Error("GLB body is empty or unexpectedly small");

console.log("POST /api/convert multipart GLB smoke test: OK ("+response.body.length+" bytes)");
