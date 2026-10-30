import net from 'node:net';

// Test-only TCP proxy: preserve byte order while varying each direction's delay.
export async function delayedProxy(targetPort) {
  const sockets=new Set(), timers=new Set();
  let chunks=0, maxDelay=0;
  const server=net.createServer({allowHalfOpen:true}, client=>{
    const upstream=net.createConnection({host:'127.0.0.1',port:targetPort,allowHalfOpen:true});
    sockets.add(client); sockets.add(upstream);
    const close=()=>{client.destroy();upstream.destroy();};
    for(const s of [client,upstream]) { s.on('error',close); s.on('close',()=>sockets.delete(s)); }
    function pipe(source,destination) {
      let due=0, queued=0, pending=null;
      const queue=[];
      function flush() {
        if(pending)timers.delete(pending);
        pending=null;
        while(queue.length && queue[0].due<=Date.now()) {
          const item=queue.shift(); queued-=item.bytes;
          if(!destination.destroyed)item.callback();
        }
        if(queue.length) { pending=setTimeout(flush,Math.max(1,queue[0].due-Date.now()));timers.add(pending); }
      }
      function schedule(callback, bytes=0) {
        const delay=[60,120,80,140,70][chunks++%5]; maxDelay=Math.max(maxDelay,delay);
        due=Math.max(Date.now()+delay,due+1); queued+=bytes;
        if(queued>4*1024*1024) { close(); return; }
        queue.push({due,bytes,callback});
        if(!pending) { pending=setTimeout(flush,Math.max(1,due-Date.now()));timers.add(pending); }
      }
      source.on('data',chunk=>schedule(()=>destination.write(chunk),chunk.length));
      source.on('end',()=>schedule(()=>destination.end()));
    }
    pipe(client,upstream); pipe(upstream,client);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return { port:server.address().port, stats:()=>({chunks,maxDelay}), async close() {
    for(const timer of timers)clearTimeout(timer);
    for(const socket of sockets)socket.destroy();
    await new Promise(resolve=>server.close(resolve));
  } };
}
