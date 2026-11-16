# EventEase — MongoDB Database Documentation

## 1. Introduction

EventEase uses MongoDB as its primary database and Mongoose as its Object Data Modeling (ODM) library.

The database supports customer accounts, event management, ticket bookings and organizer verification.

The current backend defines three main Mongoose models:

1. User
2. Event
3. Booking

Mongoose uses the following default collection names:

| Mongoose Model | MongoDB Collection |
|---|---|
| User | users |
| Event | events |
| Booking | bookings |

## 2. Database Architecture

EventEase uses a document-oriented database structure.

Each collection stores related documents. ObjectId references connect documents between collections.

The main relationships are:

- A user can organize multiple events.
- A user can make multiple bookings.
- An event can have multiple bookings.
- A booking belongs to one customer and one event.
- A booking may reference the organizer or administrator who verified it.

## 3. User Collection

**Model:** `User.js`
**Collection:** `users`

Purpose: Stores customer, organizer and administrator account information.

| Field | Data Type | Constraints / Default |
|---|---|---|
| `_id` | ObjectId | Automatically generated |
| `name` | String | Required, trimmed |
| `email` | String | Required, unique, lowercase, trimmed |
| `password` | String | Required |
| `roles` | Array of Strings | Optional; values: customer, organizer, admin |
| `role` | String | Default: customer; values: customer, organizer, admin |
| `resetPasswordToken` | String | Optional |
| `resetPasswordExpires` | Date | Optional |
| `createdAt` | Date | Automatically generated |
| `updatedAt` | Date | Automatically updated |

### User Roles

The model supports three role values:

- Customer: discovers events and books tickets.
- Organizer: creates and manages events.
- Admin: manages administrative functions.

The model retains both `roles` and the legacy `role` field to support compatibility during migration.

### Security Considerations

- Passwords should be stored as securely hashed values, not plaintext.
- JWT authentication is used by the backend.
- Password reset information is stored using the reset token and expiration fields.

## 4. Event Collection

**Model:** `Event.js`
**Collection:** `events`

Purpose: Stores event information, including descriptions, dates, locations, pricing, images and organizer references.

| Field | Data Type | Constraints / Default |
|---|---|---|
| `_id` | ObjectId | Automatically generated |
| `title` | String | Required, 3–120 characters |
| `description` | String | Required, 10–3000 characters |
| `type` | String | Required; Online or In-person |
| `category` | String | Default: Other |
| `date` | Date | Required |
| `location` | String | Required, maximum 200 characters |
| `city` | String | Optional, maximum 80 characters |
| `province` | String | Default: empty string |
| `country` | String | Default: Pakistan |
| `venue` | String | Optional, maximum 150 characters |
| `imageUrl` | String | Optional HTTP/HTTPS URL |
| `images` | Array of Strings | Maximum 8 valid HTTP/HTTPS URLs |
| `coordinates` | Embedded Document | Optional latitude and longitude |
| `googlePlaceId` | String | Default: empty string |
| `bookingUrl` | String | Optional HTTP/HTTPS URL |
| `eventSource` | String | EventEase or External; default: EventEase |
| `providerName` | String | Default: EventEase |
| `sourceUrl` | String | Optional HTTP/HTTPS URL |
| `price` | Number | Required, minimum 0 |
| `priceKnown` | Boolean | Default: true |
| `priceLabel` | String | Default: empty string |
| `externalId` | String | Optional; sparse unique index |
| `lastVerifiedAt` | Date | Default: null |
| `status` | String | published, cancelled or completed; default: published |
| `availableSeats` | Number | Required, non-negative integer |
| `organizer` | ObjectId | References User; required for EventEase events |
| `createdAt` | Date | Automatically generated |
| `updatedAt` | Date | Automatically updated |

### Event Categories

The category field supports:

- Music
- Technology
- Business
- Education
- Arts
- Food
- Sports
- Community
- Other

### Event Types

Two event types are supported:

- Online
- In-person

### Embedded Coordinates

The Event model contains an embedded coordinates document.

| Field | Data Type | Validation |
|---|---|---|
| latitude | Number | Between -90 and 90 |
| longitude | Number | Between -180 and 180 |

Both latitude and longitude must be provided together.

The coordinates document does not have its own `_id`.

### Event Validation Rules

- In-person events require a city and venue.
- Event titles must contain at least 3 characters.
- Descriptions must contain at least 10 characters.
- Event prices cannot be negative.
- Available seats must be non-negative whole numbers.
- An event can contain a maximum of 8 images.
- Image and booking URLs must use HTTP or HTTPS when provided.

## 5. Booking Collection

**Model:** `Booking.js`
**Collection:** `bookings`

Purpose: Stores customer ticket bookings and verification information.

| Field | Data Type | Constraints / Default |
|---|---|---|
| `_id` | ObjectId | Automatically generated |
| `event` | ObjectId | Required; references Event |
| `customer` | ObjectId | Required; references User |
| `quantity` | Number | Required, minimum 1 |
| `totalAmount` | Number | Required, minimum 0 |
| `bookingReference` | String | Required, unique |
| `idempotencyKey` | String | Default: null |
| `status` | String | Confirmed, Cancelled or Used; default: Confirmed |
| `usedAt` | Date | Default: null |
| `verifiedBy` | ObjectId | Optional; references User |
| `createdAt` | Date | Automatically generated |
| `updatedAt` | Date | Automatically updated |

### Booking Status

The booking status supports:

- Confirmed: booking is confirmed.
- Cancelled: booking has been cancelled.
- Used: ticket has been used or verified.

### Ticket Verification

The Booking model contains:

- `status` to track booking and ticket usage.
- `usedAt` to record when a ticket was used.
- `verifiedBy` to reference the user who verified the ticket.

The application supports upload-only QR image verification. No live camera scanner is required.

## 6. Database Relationships

### User and Event

A user can organize multiple events.

The Event model contains:

`organizer → User._id`

The organizer field is required for EventEase-created events. It is not required for external events.

### User and Booking

A customer can create multiple bookings.

The Booking model contains:

`customer → User._id`

### Event and Booking

An event can have multiple bookings.

The Booking model contains:

`event → Event._id`

### User and Verified Booking

A booking may reference the user who verified it.

The Booking model contains:

`verifiedBy → User._id`

This reference is optional and defaults to null.

## 7. Indexes and Database Optimization

The schemas declare indexes to improve data retrieval and prevent certain duplicate records.

### User Index

| Index | Purpose |
|---|---|
| `email` unique | Prevents duplicate email addresses |

### Event Indexes

| Index | Purpose |
|---|---|
| `externalId` unique and sparse | Prevents duplicate external event identifiers when present |
| `status, date` | Supports event discovery and date-based queries |
| `organizer, eventSource, createdAt` | Supports organizer event management queries |

### Booking Indexes

| Index | Purpose |
|---|---|
| `bookingReference` unique | Prevents duplicate booking references |
| `customer, idempotencyKey` unique and partial | Prevents duplicate keyed booking requests for a customer |
| `customer, createdAt` | Supports customer booking history |
| `customer, status` | Supports customer booking analytics |
| `event, status` | Supports event booking analytics |
| `status, event` | Supports booking popularity queries |

These indexes are declared in the Mongoose schemas. Their actual creation and presence in the deployed MongoDB database should be verified separately.

## 8. Database Validation and Integrity

The application uses Mongoose schema validation to enforce data requirements.

Important rules include:

- Required fields must be supplied.
- Email addresses are unique at the database index level.
- Booking references are unique.
- Booking quantities must be at least one.
- Booking amounts cannot be negative.
- Event prices cannot be negative.
- Available seats must be non-negative integers.
- Event image collections cannot exceed eight images.
- Event coordinates must contain both latitude and longitude.
- In-person events must contain city and venue information.

ObjectId references connect related documents. These references do not automatically guarantee that every referenced document exists; application logic must maintain referential integrity.

## 9. Database Design Decisions

### Document-Oriented Design

MongoDB stores each record as a document. This makes it suitable for event information with optional fields such as images, external links and coordinates.

### Referencing

Users, events and bookings use ObjectId references to represent relationships without duplicating complete documents.

### Embedded Documents

Event coordinates are embedded within the Event document because they are a small group of related values.

### Indexing

Indexes support common operations such as event discovery, booking history, organizer management and duplicate prevention.

## 10. Important Implementation Notes

- The current model directory contains three main models: User, Event and Booking.
- There is no separate Ticket model in the inspected model directory.
- Ticket verification information is represented through Booking fields and application functionality.
- The User model retains both modern `roles` and legacy `role` fields.
- External events may have no organizer reference.
- The database uses Mongoose timestamps for the three main models.
- The existing MongoDB database and its data must be preserved during maintenance.

## 11. Conclusion

The EventEase database uses three primary MongoDB collections to support user management, event management and ticket booking.

Mongoose references represent relationships between users, events and bookings. Schema validation and declared indexes help maintain data quality and support efficient queries.

This database design provides the foundation for EventEase's event discovery, booking, digital ticket and organizer verification functionality.
