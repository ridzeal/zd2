# Kill whatever is on port 3020, then start Vite dev server on that port
dev:
    @bash -c 'fuser -k 3020/tcp 2>/dev/null; sleep 0.5; npx vite'
