#!/bin/sh

pip install --user awscli   
npm run build
aws s3 sync ./build s3://$S3_BUCKET/ --acl public-read
aws configure set preview.cloudfront true
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION --paths "/*"
