import { ThreadLocal } from '../index';
import * as fs from "fs";
import * as path from "path";
import * as koa from "koa";
let tls = new ThreadLocal();
var app = new koa();
var Logger = {
    info(msg) {
        console.log(msg, tls.getProp('traceId'));
    }
};

let business = async function(ctx){
    let v = await new Promise((res)=>{
        setTimeout(()=>{
            Logger.info('service执行结束')
            res(123);
        },1000);
    });
    let c = await new Promise((res, rej)=>{
        fs.readFile(path.join(process.cwd(), "package.json"), "utf8", (e,d)=>{
            if (e) {
                return rej(e);
            }
            res(d);
        });
    })
    ctx.body = 'hello world' + c;
    Logger.info(`请求返回, path: ${ctx.url}`)
};


app.use(async(ctx, next)=>{
    await tls.run(async ()=>{
        tls.setProp('traceId', Date.now())
        await business(ctx);
        Logger.info("end of callback...");
    });
    await next();
});

app.use(async(ctx, next) => {
    await tls.run(async ()=>{
        tls.setProp('traceId',123123)
        Logger.info("last filter...");
    });
});

app.listen(8088);

Logger.info(`server start, listening port 8088`);
