#!/bin/bash


echo "📋 Peeak Application Logs"
echo "=========================="
echo ""

# Menu
echo "Select log to view:"
echo "1) PM2 Application logs"
echo "2) PM2 Error logs only"
echo "3) Nginx access logs"
echo "4) Nginx error logs"
echo "5) All logs combined"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "Viewing PM2 application logs..."
        pm2 logs peeak
        ;;
    2)
        echo "Viewing PM2 error logs..."
        tail -f /root/.pm2/logs/peeak-error.log
        ;;
    3)
        echo "Viewing Nginx access logs..."
        sudo tail -f /var/log/nginx/access.log
        ;;
    4)
        echo "Viewing Nginx error logs..."
        sudo tail -f /var/log/nginx/error.log
        ;;
    5)
        echo "Viewing all logs..."
        pm2 logs peeak --lines 50
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
