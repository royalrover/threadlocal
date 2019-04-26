import * as fs from "fs";
import * as path from "path";
import * as util from "util";

export function debugFile(...args) {
    fs.writeFileSync(path.join(process.cwd(), "tls.debug.log"), `${util.format(...args)}\n`, {flag: "a"});
}

export function debugConsole(...args) {
    fs.writeSync(1, `${util.format(...args)}\n`);
}
