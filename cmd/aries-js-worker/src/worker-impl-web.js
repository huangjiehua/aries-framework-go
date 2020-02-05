/*
Copyright SecureKey Technologies Inc. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

// args will contain the arguments passed into the worker as query parameters in the worker script's uri.
// We need the parameters "wasm" and "wasmJS" that point to the absolute path of the wasm binary and
// the Go webssembly JS wrapper script respectively.
const args = {};
location.search.slice(1).split("&").forEach(param => {
    const kv = param.split("=")
    args[kv[0]] = kv[1]
})

// Only relative paths work in the browser.
// We expect the wasmJS and wasm files to be siblings of this script.
const wasmJS = "." + args["wasmJS"].substr(args["wasmJS"].lastIndexOf("/"))
const wasm = "." + args["wasm"].substr(args["wasm"].lastIndexOf("/"))

self.importScripts(wasmJS)

if (!WebAssembly.instantiateStreaming) { // polyfill
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
        const source = await (await resp).arrayBuffer();
        return await WebAssembly.instantiate(source, importObject);
    };
}

const go = new Go();
WebAssembly.instantiateStreaming(fetch(wasm), go.importObject).then(
    result => { go.run(result.instance); },
    err => { throw new Error("failed to fetch wasm blob: " + err.message) }
);

handleResult = function(r) {
    postMessage(JSON.parse(r))
}

onmessage = function(m) {
    // handleMsg is not defined here but is instead defined by the WASM blob during initialization
    handleMsg(JSON.stringify(m.data))
}