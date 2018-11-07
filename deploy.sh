#!/bin/bash
npm run build && clevis upload xdai.io && clevis invalidate $(cat cloudfront.id.2)
