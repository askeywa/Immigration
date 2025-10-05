#!/bin/bash
# Start server with increased heap memory limit
exec node --max-old-space-size=256 ./dist/server.js
