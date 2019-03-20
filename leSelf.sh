#!/bin/bash
sudo certbot certonly -d s.xdai.io
sudo cp /etc/letsencrypt/live/s.xdai.io/fullchain.pem .
sudo cp /etc/letsencrypt/live/s.xdai.io/privkey.pem .
sudo chmod 0755 fullchain.pem
sudo chmod 0755 privkey.pem
