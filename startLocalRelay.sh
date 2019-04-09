#!/bin/bash
docker rm -f gsn
echo "Starting local GSN relay..."
docker run --name gsn --rm -t -p 8090:8090 tabookey/gsn-dev-server:v0.3
