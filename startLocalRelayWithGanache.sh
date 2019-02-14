#!/bin/bash
docker run --rm -p 8090:8090 -p 8545:8545 -t tabookey/gsn-dev-server:v0.3.1 /start-relay-with-ganache.sh
