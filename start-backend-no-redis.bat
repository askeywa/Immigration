@echo off
echo Starting Backend Server without Redis...
cd backend
set REDIS_ENABLED=false
npm run start:dev
