#!/bin/bash
docker run -ti --rm --name clevis -p 3000:3000 -p 8545:8545 -v ${PWD}:/dapp austingriffith/clevis
