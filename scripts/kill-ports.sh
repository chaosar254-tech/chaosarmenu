#!/bin/bash
# Port 3000-3003 üzerinde çalışan süreçleri sonlandırır (EADDRINUSE önleme)
PORTS="3000 3001 3002 3003"
for port in $PORTS; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null
    echo "Port $port temizlendi (PID: $pid)"
  fi
done
