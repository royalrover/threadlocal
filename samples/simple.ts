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
