# EventEase — Entity Relationship Diagram

This diagram represents the three primary Mongoose models found in the EventEase backend: User, Event and Booking.

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ EVENT : organizes
    USER ||--o{ BOOKING : makes
    EVENT ||--o{ BOOKING : receives
    USER o|--o{ BOOKING : verifies

    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        String[] roles
        String role
        String resetPasswordToken
        Date resetPasswordExpires
        Date createdAt
        Date updatedAt
    }

    EVENT {
        ObjectId _id PK
        String title
        String description
        String type
        String category
        Date date
        String location
        String city
        String province
        String country
        String venue
        String imageUrl
        String[] images
        Object coordinates
        String googlePlaceId
        String bookingUrl
        String eventSource
        String providerName
        String sourceUrl
        Number price
        Boolean priceKnown
        String priceLabel
        String externalId
        Date lastVerifiedAt
        String status
        Number availableSeats
        ObjectId organizer FK
        Date createdAt
        Date updatedAt
    }

    BOOKING {
        ObjectId _id PK
        ObjectId event FK
        ObjectId customer FK
        Number quantity
        Number totalAmount
        String bookingReference UK
        String idempotencyKey
        String status
        Date usedAt
        ObjectId verifiedBy FK
        Date createdAt
        Date updatedAt
    }
```

## Relationship Explanation

| Relationship | Description |
|---|---|
| User → Event | A user can organize multiple EventEase events. |
| User → Booking | A customer can create multiple bookings. |
| Event → Booking | An event can receive multiple bookings. |
| User → Booking verification | A user can verify multiple bookings; each booking can have an optional verifier. |

## Diagram Notes

- PK means Primary Key.
- FK means Foreign Key reference through MongoDB ObjectId.
- UK means unique field or unique index.
- The diagram represents logical relationships, not relational database tables.
- Coordinates are embedded in the Event document.
- The organizer reference is conditionally required for EventEase-created events.
- The verifier reference is optional.
- MongoDB references are not SQL foreign-key constraints.
