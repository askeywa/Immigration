#!/bin/bash

echo "🔍 CHECKING APPLICATION LOGS"
echo "============================"

echo "📋 Checking if application is receiving requests..."

# Check PM2 logs (most common for Node.js production)
echo "📄 PM2 logs (last 50 lines):"
pm2 logs --lines 50 2>/dev/null | tail -20

echo ""
echo "🔍 Looking for user creation logs specifically:"
pm2 logs --lines 100 2>/dev/null | grep -i "creating\|tenant\|user" | tail -10

echo ""
echo "🔍 Looking for any error logs:"
pm2 logs --lines 100 2>/dev/null | grep -i "error\|fail\|timeout" | tail -10

echo ""
echo "📊 SUMMARY:"
echo "Scenario A - You see 'Creating tenant user' logs:"
echo "  → Your app IS receiving requests and processing them"
echo "  → Problem is likely slow processing or Nginx timeout"
echo ""
echo "Scenario B - You see NO user creation logs:"
echo "  → Request is dying before reaching your application"
echo "  → Likely Nginx blocking, app crashed, or routing issue"
