#!/bin/bash
echo "Initializing LocalStack SNS/SQS/S3 resources..."

export AWS_DEFAULT_REGION=ap-northeast-2

# SNS Topics
awslocal sns create-topic --name approval-completed
awslocal sns create-topic --name approval-submitted
awslocal sns create-topic --name appointment-executed
awslocal sns create-topic --name employee-affiliation-changed
awslocal sns create-topic --name employee-created
awslocal sns create-topic --name leave-requested
awslocal sns create-topic --name notification-send
awslocal sns create-topic --name hr-saas-recruitment-interview-reminder

# SQS Queues (per consumer service)
awslocal sqs create-queue --queue-name attendance-service-queue
awslocal sqs create-queue --queue-name appointment-service-queue
awslocal sqs create-queue --queue-name employee-service-queue
awslocal sqs create-queue --queue-name organization-service-queue
awslocal sqs create-queue --queue-name notification-service-queue

# Dead Letter Queues
awslocal sqs create-queue --queue-name attendance-service-dlq
awslocal sqs create-queue --queue-name appointment-service-dlq
awslocal sqs create-queue --queue-name employee-service-dlq
awslocal sqs create-queue --queue-name organization-service-dlq
awslocal sqs create-queue --queue-name notification-service-dlq

# SNS → SQS Subscriptions
REGION=ap-northeast-2
ACCOUNT=000000000000

# approval-completed → multiple consumers
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:approval-completed \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:attendance-service-queue
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:approval-completed \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:appointment-service-queue
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:approval-completed \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:employee-service-queue

# appointment-executed → employee-service
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:appointment-executed \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:employee-service-queue

# employee-affiliation-changed → organization-service
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:employee-affiliation-changed \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:organization-service-queue

# Notification subscriptions (multiple topics → notification queue)
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:approval-submitted \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:notification-service-queue
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:leave-requested \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:notification-service-queue
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:employee-created \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:notification-service-queue
awslocal sns subscribe --topic-arn arn:aws:sns:${REGION}:${ACCOUNT}:hr-saas-recruitment-interview-reminder \
  --protocol sqs --notification-endpoint arn:aws:sqs:${REGION}:${ACCOUNT}:notification-service-queue

# S3 Bucket for file-service
awslocal s3 mb s3://hr-platform-files

# S3 CORS configuration (for frontend direct upload)
awslocal s3api put-bucket-cors --bucket hr-platform-files --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

echo "LocalStack SNS/SQS/S3 initialization complete!"
