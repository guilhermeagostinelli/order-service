#!/bin/bash
/wait-for-it.sh rabbitmq:5672 -t 60 -- echo "RabbitMQ is up"
/wait-for-it.sh postgres:5432 -t 60 -- echo "PostgreSQL is up"
node dist/index.js