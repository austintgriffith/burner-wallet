#!/bin/bash
#npm run build &&
./node_modules/clevis/bin.js upload xdai.io && ./node_modules/clevis/bin.js invalidate $(cat cloudfront.id.2)
