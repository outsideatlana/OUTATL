import { readFileSync } from "node:fs";
import { join } from "node:path";

const connectionPath = join(process.cwd(), ".lovable", "connection.json");
const connection = JSON.parse(readFileSync(connectionPath, "utf8"));

console.log("Lovable front-end connection");
console.log(`Project:  ${connection.projectId}`);
console.log(`Status:   ${connection.status}`);
console.log(`Template: ${connection.template}`);
console.log(`URL:      ${connection.projectUrl}`);
console.log("");
console.log("Local front-end");
for (const [label, path] of Object.entries(connection.localFrontend)) {
  console.log(`${label.padEnd(10)} ${path}`);
}
console.log("");
console.log(`Lovable config package: ${connection.lovableFrontend.configPackage}`);
console.log(`Supabase project:       ${connection.supabase.projectId}`);
