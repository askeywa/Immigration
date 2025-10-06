#!/bin/bash

echo "🚀 QUICK DIAGNOSTIC COMMANDS"
echo "============================"
echo ""
echo "Run these commands on your EC2 instance to diagnose the 504 timeout:"
echo ""

echo "1️⃣ CHECK NGINX TIMEOUT (2 minutes):"
echo "ssh your-server"
echo "sudo grep 'proxy_read_timeout' /etc/nginx/ -r"
echo ""
echo "If you see 'proxy_read_timeout 60s', that's your problem!"
echo "Your app might be working fine but taking longer than 60s."
echo ""

echo "2️⃣ TEST MONGODB CONNECTION (2 minutes):"
echo "node check-mongodb-connection.js"
echo ""
echo "If this takes >2 seconds or fails, MongoDB is your problem."
echo ""

echo "3️⃣ CHECK APP LOGS (2 minutes):"
echo "pm2 logs | tail -20"
echo ""
echo "Look for 'Creating tenant user' or 'TENANT RESOLUTION START' logs."
echo "If you see these logs, your app is receiving requests."
echo "If no logs, request is dying before reaching your app."
echo ""

echo "🎯 PRIORITY ORDER:"
echo "1. Check Nginx timeout (most likely culprit)"
echo "2. Test MongoDB connection (rules out database issues)"
echo "3. Check app logs (confirms request reception)"
echo ""

echo "Do these three checks BEFORE deploying any more code!"
echo "The results will tell you exactly where the problem is."
