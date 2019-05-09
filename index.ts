/*!
 * ThreadLocal in Node.js
 * alias "Async Context Bound"
 */
import * as util from "util";
import * as fs from "fs";
import * as async_hooks from "async_hooks";
import * as Tree from "./lib/tree";
import { debugFile, debugConsole } from "./lib/util";
const { AsyncResource } = async_hooks;
const { Node } = Tree;
const SumeruResource = "Sumeru";

// 须弥
class Sumeru extends AsyncResource {
  // create Sumeru async resource
  public static async run(cb: Function) {
    // emit init hook
    const instance = new Sumeru();
    await instance._run(cb);
    instance.close();
  }

  constructor() {
    super("Sumeru");
  }

  public async run(cb) {
    await this._run(cb);
    this.close();
  }

  private _run(callback) {
      // call before hook
      (this as any).emitBefore();
      // exec async function, must return promise
      const promise = callback();
      // call after hook
      (this as any).emitAfter();
      return promise;
  }

  private close() {
    // call destroy hook
    (this as any).emitDestroy();
  }
}

export class ThreadLocal {
  public static invokerRoot: any;
  public static asyncHooks: any;
  private sumerus = new Map<number, Sumeru>();
  
  constructor() {
    try {
      ThreadLocal.asyncHooks = async_hooks;
      ThreadLocal.invokerRoot = new Node(async_hooks.executionAsyncId());
    } catch (e) {
      return;
    }
  
    const self = this;

    function init(asyncId, type, triggerId, resource) {
      const currentId = async_hooks.executionAsyncId();
      // don't want the initial start TCPWRAP
      if (currentId === 1 && type === "TCPWRAP") {
        return;
      }
      // executionAsyncId() of 0 means that it is being executed from C++ with no JavaScript stack above it
      if (triggerId === 0) {
        return;
      }

      if (type === SumeruResource) {
        debugFile("Sumeru", asyncId);
        const sumeruNode = new Node(asyncId);
        self.sumerus.set(asyncId, sumeruNode);

        const parent = ThreadLocal.invokerRoot.search(triggerId);
        if (parent) {
          parent.appendChild(sumeruNode);
        } else {
          ThreadLocal.invokerRoot.appendChild(sumeruNode);
        }
      } else {
        debugFile("other", asyncId, triggerId);
        const parent = ThreadLocal.invokerRoot.search(triggerId);
        if (parent) {
          const sumeruNode = new Node(asyncId);
          parent.appendChild(sumeruNode);
        }
      }
    }
  
    function destroy(asyncId) {
      // debugFile(`del asyncId`, asyncId)
      if (self.sumerus.has(asyncId)) {
        // let semeruNode = self.sumerus.get(asyncId)
        ThreadLocal.invokerRoot.removeChild(asyncId);
        self.sumerus.delete(asyncId);
      }
    }

    const hooks = {
      destroy,
      init,
    };
  
    const asyncHook = async_hooks.createHook(hooks);
    asyncHook.enable();
  }

  public setProp(k, v) {
    const currentId = ThreadLocal.asyncHooks.executionAsyncId();
    let node = ThreadLocal.invokerRoot.search(currentId);
    if (!node) {
      node = ThreadLocal.invokerRoot.search(ThreadLocal.asyncHooks.triggerAsyncId());
    }
    if (!node) {
      return console.error("[rockerjs/tls] can\'t find node");
    }

    node.data(k, v);
  }

  public getProp(k) {
    const currentId = ThreadLocal.asyncHooks.executionAsyncId();
    let node = ThreadLocal.invokerRoot.search(currentId);
    if (!node) {
      node = ThreadLocal.invokerRoot.search(ThreadLocal.asyncHooks.triggerAsyncId());
    }

    if (!node) {
      return console.error("[rockerjs/tls] can\'t find node");
    }

    for (; !!node; node = node.parent) {
      const re = node.data(k);
      if (re) {
        return re;
      }
    }
  }

  // entry
  public async run(fn: Function) {
    await Sumeru.run(fn);
  }
}
