# Node.js's ThreadLocal -- Async Context Bound

Using Node.js's ThreadLocal to trace request information among middlewares or RPC. 

ThreadLocal in Node.js also means **"Async Context Bound"**. Because of event loop in libuv, Async Context Bound has the same effect just like threadlocal storage.

> node.js's version >= 8.9.4

## 一、快速上手

install

```sh
npm install @rockerjs/tls
```

> @rockerjs/tls only save async context wrapped in promise, #[because asyncId and triggerAsyncId related to execution timing, not causality](http://nodejs.cn/api/async_hooks.html#async_hooks_async_hooks_executionasyncid). 


示例 1

```typescript
import { ThreadLocal } from '../index';
let tls = new ThreadLocal();

tls.run(async ()=>{
    tls.setProp("traceInfo", {
        invoke: "noop"
    });
    
    await new Promise((res) => {
        setTimeout(() => {
            console.log('get Traceinfo in timer', tls.getProp("traceInfo"));
            res();
        }, 20);
    });

    setTimeout(() => {
        console.log('can\'t get Traceinfo in timer', tls.getProp("traceInfo"));
    }, 20);

    console.log('get Traceinfo in function', tls.getProp("traceInfo"))
});
```


实例2

```typescript
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
```

## License

MIT
