#!/bin/bash

# Logs Viewer Script for Peeak
# Displays application and system logs

echo "📋 Peeak Application Logs"
echo "=========================="
echo ""

# Menu
echo "Select log to view:"
echo "1) Application logs (Docker)"
echo "2) Nginx access logs"
echo "3) Nginx error logs"
echo "4) System logs"
echo "5) All logs (tail -f)"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "Viewing Docker application logs..."
        docker compose logs -f
        ;;
    2)
        echo "Viewing Nginx access logs..."
        sudo tail -f /var/log/nginx/access.log
        ;;
    3)
        echo "Viewing Nginx error logs..."
        sudo tail -f /var/log/nginx/error.log
        ;;
    4)
        echo "Viewing system logs..."
        sudo journalctl -f
        ;;
    5)
        echo "Viewing all logs..."
        docker compose logs -f &
        sudo tail -f /var/log/nginx/access.log &
        sudo tail -f /var/log/nginx/error.log &
        wait
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
