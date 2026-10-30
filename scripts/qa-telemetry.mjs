import { monitorEventLoopDelay } from 'node:perf_hooks';
// Loaded only by the local soak harness, never by the deployed start command.
const lag=monitorEventLoopDelay({resolution:20});lag.enable();
setInterval(()=>{
  process.send?.({kind:'qaMetrics',at:Date.now(),...process.memoryUsage(),loopMeanMs:lag.mean/1e6,loopMaxMs:lag.max/1e6});
  lag.reset();
},5000).unref();
