#!/bin/bash
docker run -e "HTTPS=true" -ti --rm --name clevis -p 3000:3000 -p 8545:8545 -v ${PWD}:/dapp austingriffith/clevis
