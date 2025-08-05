# order-service

A sample order service built with Node.js, TypeScript, RabbitMQ, and PostgreSQL, using Docker for containerization.

This project demonstrates a basic e-commerce order processing service that integrates with a CRM system. It showcases common design patterns, clean architecture principles, and practical software development best practices.

## Functional Context
The Order Service is responsible for handling order events and notifying a CRM system when new customer orders are placed.

The service consumes messages from an `order.queue`, which can be one of the following event types:
- Order Created (`order.created`)
- Order Cancelled (`order.cancelled`)

Each event is processed by a different handler.

When an `order.created` event is received, the order data is saved to the database and the CRM is notified about the new order by sending a message to another queue: `crm.queue`.

CRM messages are processed in batches, assuming they do not require strict real-time handling and to accommodate a scenario where the CRM API is rate-limited. A retry mechanism (max retries + exponential backoff) is implemented for handling failures when sending messages to the CRM. In case of repetitive failures, after the maximum number of retries, the message is sent to a dead-letter queue (DLQ) for further inspection.

When an `order.cancelled` event is received, it does not trigger any business logic beyond logging; it is simply acknowledged to indicate that the event has been handled. In a real-world application, this event could be used to update the order status in the database, release reserved inventory, notify other systems, or trigger additional workflows depending on the business requirements.

Notes:
- The database schema is simplistic and should possibly be adjusted for real-world use cases.
- The code responsible for consuming messages from the `crm.queue` has been kept in this service for simplicity, but in a real-world scenario, it would possibly be better to have it in a separate service.
- Additionally, the `order.created` and `order.cancelled` events could be handled on separate queues and services if in a real-world scenario they had different scaling needs.

## App Configuration

**Application Behavior Configuration**
The following settings can be adjusted in `/src/config/index.ts` to control how the application processes messages:
- `batches.maxSize`: Maximum number of messages that can be accumulated in the batch before messages are processed.
- `batches.flushIntervalMs`: Time interval (in milliseconds) in which messages in the batch are processed.
- `maxRetries`: Maximum number of retries before a failed message is sent to a dead-letter queue (DLQ).

**Environment Variables**
Environment variables used to configure external services in `.env.example`:
- RABBITMQ_URL: URL for the RabbitMQ server.
- RABBITMQ_ORDER_QUEUE: Name of the RabbitMQ queue for order events.
- RABBITMQ_CRM_QUEUE: Name of the RabbitMQ queue for CRM events.
- RABBITMQ_CRM_DEAD_LETTER_QUEUE: Name of the RabbitMQ dead-letter queue for CRM events.
- DATABASE_URL: Connection string for the PostgreSQL database.

## Getting Started

### Prerequisites
1. Make sure you have Docker and Docker Compose installed.
2. For local development, ensure you have Node.js and npm installed.

### How to run the application
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/guilhermeagostinelli/order-service.git
   cd order-service
   ```
2. Build and start the containers:
    ```bash
    docker compose up --build
    ```
  The order service will be running on port 3000, RabbitMQ on ports
    5672 and 15672 (management UI), and PostgreSQL on port 5432.
    The database can be accessed via Adminer on port 8080.

### How to run tests locally
1. Install dependencies with `npm install`
2. Run the tests with `npm run test`

## How to publish a test message to the orders.queue and inspect it
1. Access RabbitMQ management UI on your browser: http://localhost:15672
2. Log in with the following credentials:
   - Username: guest
   - Password: guest
3. Navigate to the "Queues and Streams" tab and click on `order.queue`.
4. Scroll down to the "Publish message" section.
5. In the "Payload" field, enter a JSON message (see examples below) and click on "Publish message".

    The following JSON messages can be published to the order.queue:

    For Order Created event:

    ```
    {
      "type": "order.created",
      "payload": {
        "customer_email": "client123@example.com",
        "total_amount": 90.50
      }
    }
    ```

    For Order Cancelled event:

    ```
    {
      "type": "order.cancelled",
      "payload": {
        "order_id": "xyz-123",
        "reason": "customer request"
      }
    }
    ```

## How to inspect database (Adminer)
1. Access Adminer (lightweight web-based visual inspector for PostgreSQL) on your browser: http://localhost:8080
2. Log in with the following info:
   - System: PostgreSQL
   - Server: postgres
   - Username: postgres
   - Password: postgres
   - Database: orders
3. Click on the "orders" table.
4. Click on "Select data" to view the stored orders.

## Project Structure
```
src/
├── application/         # Application business logic layer
│   ├── batches/            # Batch processing implementations
│   └── handlers/           # Handlers for different order events
├── config/              # Application configuration
├── core/                # Interfaces and types
│   ├── api/                # External API interfaces
│   ├── batches/            # Batch processing interfaces
│   ├── dtos/               # Data Transfer Objects
│   ├── logger/             # Logging interfaces
│   ├── messaging/          # Messaging and event interfaces
│   └── repositories/       # Repository interfaces
└── infra/               # External implementations
    ├── api/                # External API implementations
    ├── db/                 # DB connections and implementations
    │   └── repositories/     # Repository implementations
    ├── logger/          # Logger implementations
    └── messaging/       # Message queue implementations
        └── consumers/   # Queue consumers
```

The project follows a Clean Architecture approach with three main layers:

- Core: Contains all business domain interfaces and types. This layer has no dependencies on external frameworks or libraries.
- Application: Contains the business logic implementation.
- Infrastructure: Contains all external implementations (api, database, messaging, logging). This layer implements interfaces from the core layer.

This structure ensures and promotes:
- Clear separation of concerns
- Dependency inversion principle
- Easy testing and maintenance
- Scalability and flexibility

## Design Patterns
Some of the design patterns used in this project include:

- Singleton:
Used in `CrmBatchProcessor` and `WinstonLogger` via `getInstance()` static method to ensure only one instance exists. This is useful for shared resources like logging and batch processing.
- Repository:
Used in `IOrderRepository` interface and `PostgresOrderRepository` implementation to abstract data access.
- Adapter:
`RabbitMQMessageHandler` adapts RabbitMQ's message handling to the application's `IMessageHandler` interface.
- Strategy:
Event handling strategies in `orderEventHandlersRegistry.ts` where different handlers are chosen based on event type.
- Dependency Injection:
Used throughout the codebase. Dependencies are injected via constructors, promoting loose coupling and easier testing.

These patterns help maintain:
- Loose coupling
- Separation of concerns
- Adherence to SOLID principles
- Code reusability
- Testability
- Flexibility for future changes

## Potential Improvements
This project has been kept simple for demonstration purposes. Some possible improvements include:
- Handle concurrency/race condition issues on `CrmBatchProcessor`
- Use retry mechanism + DLQ for failures when processing orders as well
- Add linting rules/checking
- Add integration tests
- CI/CD
- Increase decoupling of certain classes
- Use a framework for dependency injection/Service Locator (e.g. InversifyJS, TSyringe, etc)
- Use an ORM for more robust database interactions (e.g. TypeORM, Prisma, etc)

## Simulating Failures
- Uncomment the relevant lines in `/src/infra/api/CrmApi.ts` to simulate random CRM API failures.