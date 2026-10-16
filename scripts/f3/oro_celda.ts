import { huella } from "../../src/game/oro_caseta.ts";
const [p, c] = process.argv.slice(2);
const out = []; for (let s = 1; s <= 40; s++) out.push(huella(p!, c as any, s));
console.log(JSON.stringify(out));
