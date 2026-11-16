# EventEase
## Software Requirements Specification (SRS)

**Project Name:** EventEase – Event Management and Ticketing System
**Document Type:** Software Requirements Specification
**Version:** 1.0
**Project Scope:** Pakistan
**Project Status:** Developed and deployed
**Frontend:** React
**Backend:** Node.js and Express.js
**Database:** MongoDB
**Deployment Platform:** Vercel

---

## 1. Introduction

### 1.1 Purpose

The purpose of this Software Requirements Specification (SRS) is to define the functional and non-functional requirements of EventEase, a web-based event management and ticketing system.

This document describes the system's intended functionality, users, interfaces, operational constraints, business rules and quality requirements. It serves as a reference for developers, testers, project evaluators and future maintainers.

### 1.2 Project Overview

EventEase is a web-based platform designed to simplify event discovery, event management and ticket booking in Pakistan.

The system allows customers to explore available events and book tickets. Organizers can manage their events, while administrators oversee platform activities. Customers receive digital booking information, including QR-based ticket verification support.

The application uses a React frontend, a Node.js and Express.js backend, and MongoDB for data storage.

### 1.3 Problem Statement

Traditional event discovery and ticket booking can involve scattered information, manual coordination and difficulty verifying tickets.

Event organizers may also face challenges managing event information, bookings and attendee verification in an organized way.

EventEase addresses these problems by providing a centralized digital platform for event discovery, event management, ticket booking and QR-based ticket verification.

### 1.4 Objectives

The main objectives are:

1. Provide a centralized platform for discovering events in Pakistan.
2. Allow users to register, log in and access role-based functionality.
3. Enable organizers to create and manage events.
4. Allow customers to book available event tickets.
5. Generate digital booking and ticket information.
6. Support ticket verification through uploaded QR-code images.
7. Maintain organized records of users, events and bookings.
8. Provide an accessible and responsive user interface.
9. Improve the efficiency of event and booking management.

### 1.5 Intended Audience

This document is intended for:

- University project evaluators and instructors.
- Software developers and maintainers.
- Software testers.
- Event organizers.
- End users and customers.
- Future contributors to the EventEase project.

### 1.6 Definitions and Acronyms

| Term | Definition |
|---|---|
| SRS | Software Requirements Specification |
| UI | User Interface |
| API | Application Programming Interface |
| DB | Database |
| CRUD | Create, Read, Update and Delete |
| JWT | JSON Web Token |
| QR Code | Quick Response Code |
| Customer | User who discovers events and books tickets |
| Organizer | User who manages events |
| Administrator | User responsible for platform administration |
| Booking | A customer's reservation of event tickets |

---

## 2. Overall Description

### 2.1 Product Perspective

EventEase is a full-stack web application consisting of three primary layers:

1. **Frontend:** React-based user interface.
2. **Backend:** Node.js and Express.js REST API.
3. **Database:** MongoDB database accessed through Mongoose.

The frontend communicates with the backend through API requests. The backend processes business logic, validates requests and interacts with MongoDB.

The application is deployed for online access.

### 2.2 Product Functions

The major functions of EventEase include:

- User registration and login.
- Role-based access to system functionality.
- Event browsing and discovery.
- Event searching and filtering.
- Event creation and management.
- Ticket booking.
- Booking and digital ticket information.
- QR-code-based ticket verification using an uploaded image.
- Booking and event status management.
- Dashboard and analytical functionality.
- Responsive user interface.

### 2.3 User Classes and Characteristics

#### 2.3.1 Customer

Customers are users who access the platform to:

- Register and log in.
- Browse available events.
- Search and filter events.
- View event details.
- Book tickets.
- Access their booking and ticket information.

#### 2.3.2 Organizer

Organizers are users who manage events. Their intended activities include:

- Accessing organizer functionality.
- Creating events.
- Updating event information.
- Managing their events.
- Reviewing relevant booking information.
- Verifying eligible tickets through the QR upload process.

#### 2.3.3 Administrator

Administrators are responsible for platform-level management. Their intended activities include:

- Accessing administrative functionality.
- Overseeing users and platform activities.
- Managing or monitoring event-related information.
- Reviewing system-level information and analytics.

Access to each function is controlled by the application's authorization rules.

### 2.4 Operating Environment

| Component | Technology |
|---|---|
| Client interface | React |
| Programming language (frontend) | JavaScript |
| Backend runtime | Node.js |
| Backend framework | Express.js |
| Database | MongoDB |
| Database object modeling | Mongoose |
| Authentication | JWT-based authentication |
| Frontend hosting | Vercel |
| Backend hosting | Vercel |
| Development environment | Visual Studio Code |
| Version control | Git and GitHub |

Users access the application through a modern web browser on supported desktop and mobile devices.

### 2.5 Design and Implementation Constraints

- The system is designed with a Pakistan-focused event scope.
- The application requires an internet connection for its deployed services.
- The backend depends on the configured MongoDB database.
- Authentication and protected operations depend on valid authorization.
- The application must keep sensitive configuration values outside public source code.
- QR verification uses uploaded QR-code images; live camera scanning is outside the current project scope.
- Event and booking operations must follow the validation rules implemented in the backend.

### 2.6 Assumptions and Dependencies

- Users have access to a supported web browser and internet connection.
- Users provide valid information during registration and booking.
- The MongoDB database and deployed backend are available when the application is used.
- Organizers and administrators have the appropriate assigned permissions.
- Event information is supplied and maintained by authorized sources or organizers.
- External services, where configured, remain available for their respective functions.

---

## 3. System Features and Functional Requirements

Functional requirements describe what the EventEase system must do.

### 3.1 User Registration

**FR-01:** The system shall allow new users to create an account.

**FR-02:** The registration process shall collect the required user information.

**FR-03:** The system shall validate required registration fields.

**FR-04:** The system shall prevent registration with an email address that is already registered.

**FR-05:** The system shall securely store user passwords using the backend's password-security implementation.

### 3.2 User Login and Authentication

**FR-06:** The system shall allow registered users to log in.

**FR-07:** The system shall validate login credentials.

**FR-08:** The system shall reject invalid authentication credentials.

**FR-09:** The backend shall issue an authentication token after successful login.

**FR-10:** Protected operations shall require valid authentication.

**FR-11:** The system shall maintain user identity and authorization information for protected operations.

### 3.3 Role-Based Access Control

**FR-12:** The system shall support customer, organizer and administrator roles.

**FR-13:** The system shall restrict protected functionality according to user permissions.

**FR-14:** Users shall not be allowed to perform operations outside their authorized permissions.

**FR-15:** The system shall associate event and booking operations with the relevant user records.

### 3.4 Event Discovery

**FR-16:** The system shall display available event information.

**FR-17:** The system shall display relevant event details, including title, description, event type, date, location and price.

**FR-18:** The system shall support searching for events.

**FR-19:** The system shall provide event filtering functionality.

**FR-20:** The system shall distinguish between online and in-person events.

**FR-21:** The system shall support event categories, including music, technology, business, education, arts, food, sports, community and other categories.

### 3.5 Event Management

**FR-22:** Authorized organizers shall be able to create events.

**FR-23:** The system shall validate event information before saving it.

**FR-24:** Event information shall include required details such as title, description, date, location, price and available seats.

**FR-25:** The system shall support updating event information through authorized operations.

**FR-26:** The system shall support event status management.

**FR-27:** The system shall associate internally managed events with their organizer records.

**FR-28:** The system shall support the event information and source fields defined in the Event database model.

### 3.6 Ticket Booking

**FR-29:** Customers shall be able to book tickets for eligible events.

**FR-30:** The system shall validate the requested ticket quantity.

**FR-31:** The requested ticket quantity shall be at least one.

**FR-32:** The system shall calculate the total booking amount using the event price and requested quantity.

**FR-33:** The system shall maintain a unique booking reference for each booking.

**FR-34:** The system shall associate each booking with the relevant customer and event.

**FR-35:** The system shall maintain booking status information.

**FR-36:** The system shall prevent invalid booking operations, including requests that violate available-seat or booking rules.

### 3.7 Digital Tickets and QR Verification

**FR-37:** The system shall provide booking and digital ticket information for successful bookings.

**FR-38:** The system shall support QR-code-based ticket verification.

**FR-39:** An authorized user shall be able to upload a QR-code image for verification.

**FR-40:** The backend shall validate the uploaded QR information against the corresponding booking or ticket record.

**FR-41:** The system shall reject invalid or unrecognized ticket information.

**FR-42:** The system shall maintain ticket-use status.

**FR-43:** The system shall record verification-related information, including the verification time and verifying user where applicable.

**FR-44:** A ticket that has already been used shall not be treated as an unused valid ticket.

**Note:** The current QR verification workflow is based on uploading an image. Live camera scanning is not part of the current system scope.

### 3.8 Booking Management

**FR-45:** The system shall allow customers to access their relevant booking information.

**FR-46:** The system shall maintain booking statuses such as Confirmed, Cancelled and Used.

**FR-47:** The system shall associate booking records with the corresponding event and customer.

**FR-48:** The system shall maintain booking creation and update timestamps.

### 3.9 Dashboards and Analytics

**FR-49:** The system shall provide dashboard functionality for supported user roles.

**FR-50:** The system shall display relevant event or booking information according to the user's permissions.

**FR-51:** The system shall provide the analytical information supported by the implemented dashboard functionality.

### 3.10 User Interface

**FR-52:** The system shall provide a consistent and understandable user interface.

**FR-53:** The interface shall support navigation between available application features.

**FR-54:** The interface shall provide appropriate feedback for successful and unsuccessful operations.

**FR-55:** The interface shall support responsive layouts for supported screen sizes.

---

## 4. External Interface Requirements

### 4.1 User Interface

The application shall provide:

- Registration and login screens.
- Event listing and discovery screens.
- Event details.
- Event management interfaces for authorized users.
- Booking interfaces.
- Digital ticket and booking information.
- QR image upload and verification interface.
- Role-appropriate dashboard interfaces.

The interface shall provide understandable validation and status messages.

### 4.2 Software Interfaces

#### Frontend and Backend

The React frontend shall communicate with the Express backend through HTTP API requests.

The frontend API configuration shall use the `VITE_API_URL` environment variable when configured.

#### Backend and Database

The backend shall communicate with MongoDB through Mongoose models.

The database shall maintain user, event and booking information.

#### Authentication Interface

Protected backend endpoints shall use the application's authentication and authorization mechanisms.

### 4.3 Hardware Interfaces

No specialized hardware is required to use the application.

A computer, smartphone or tablet with a supported browser and internet connection is sufficient.

The QR verification feature requires an image file containing the QR code to be uploaded through the application.

### 4.4 Communication Interfaces

- HTTP/HTTPS communication between frontend and backend.
- API-based data exchange.
- Database connectivity between the backend and MongoDB.
- Secure HTTPS access for the deployed application.

---

## 5. Non-Functional Requirements

### 5.1 Performance

**NFR-01:** The system should respond to normal user operations within a reasonable time under expected usage.

**NFR-02:** Event searching and filtering should provide results without unnecessary delays.

**NFR-03:** Database queries should use appropriate indexes where beneficial.

**NFR-04:** The application should avoid unnecessary database operations and repeated requests.

### 5.2 Security

**NFR-05:** Passwords must not be stored as plain text.

**NFR-06:** Authentication tokens and protected operations must be validated by the backend.

**NFR-07:** Role-based permissions must be enforced on the backend, not only hidden in the frontend.

**NFR-08:** Environment variables must be used for sensitive configuration.

**NFR-09:** The system must validate user input before processing it.

**NFR-10:** Unauthorized users must not be allowed to access protected resources.

**NFR-11:** Ticket verification must validate the booking or ticket record rather than trusting the uploaded image alone.

### 5.3 Reliability

**NFR-12:** The system should handle invalid input and unexpected errors gracefully.

**NFR-13:** Booking records should remain associated with the correct customer and event.

**NFR-14:** The system should prevent duplicate booking operations where idempotency protection is applicable.

**NFR-15:** The application should provide meaningful error messages without exposing sensitive internal information.

### 5.4 Usability

**NFR-16:** The interface should be understandable to users with basic web application experience.

**NFR-17:** Important actions should be clearly identifiable.

**NFR-18:** Forms should provide appropriate validation feedback.

**NFR-19:** The application should provide a consistent navigation experience.

### 5.5 Compatibility

**NFR-20:** The application should work in modern browsers that support the technologies used by the frontend.

**NFR-21:** The interface should adapt to supported desktop, tablet and mobile screen sizes.

### 5.6 Maintainability

**NFR-22:** The source code should be organized into understandable frontend and backend modules.

**NFR-23:** Database schemas should define appropriate field types, validation and relationships.

**NFR-24:** Source code should be maintained through version control.

**NFR-25:** Project documentation should describe important system functionality and technical decisions.

### 5.7 Scalability

**NFR-26:** The architecture should allow future improvements to event discovery, user management and booking functionality.

**NFR-27:** Database indexes and application structure should support efficient data access as the application grows.

---

## 6. Database Requirements

EventEase uses MongoDB with Mongoose for database modeling.

The current backend model directory contains three primary models.

### 6.1 User Collection

The User collection stores account information and role-related data.

Important fields include:

- `_id`
- `name`
- `email`
- `password`
- `role`
- `roles`
- `resetPasswordToken`
- `resetPasswordExpires`
- `createdAt`
- `updatedAt`

The email field is required and unique.

### 6.2 Event Collection

The Event collection stores event information.

Important fields include:

- `_id`
- `title`
- `description`
- `type`
- `category`
- `date`
- `location`
- `city`
- `province`
- `country`
- `venue`
- `imageUrl`
- `images`
- `coordinates`
- `price`
- `priceKnown`
- `availableSeats`
- `organizer`
- `status`
- `eventSource`
- `createdAt`
- `updatedAt`

The Event model supports references to the User model for internally managed events.

### 6.3 Booking Collection

The Booking collection stores ticket booking information.

Important fields include:

- `_id`
- `event`
- `customer`
- `quantity`
- `totalAmount`
- `bookingReference`
- `idempotencyKey`
- `status`
- `usedAt`
- `verifiedBy`
- `createdAt`
- `updatedAt`

The booking reference is required and unique.

### 6.4 Database Relationships

The primary database relationships are:

1. A user can organize multiple events.
2. A customer can create multiple bookings.
3. An event can receive multiple bookings.
4. A user can be associated with ticket verification records.

The Event and Booking models use ObjectId references to related User and Event records.

For additional field definitions, constraints and indexes, refer to `docs/DATABASE_DOCUMENTATION.md`.

For the visual database relationship representation, refer to `docs/ER_DIAGRAM.md`.

---

## 7. Business Rules

The following rules govern important system operations.

**BR-01:** A user must authenticate before accessing protected functionality.

**BR-02:** A user may perform only operations permitted by their assigned role.

**BR-03:** Event creation and management must follow organizer authorization rules.

**BR-04:** Event information must satisfy the validation rules defined in the Event model.

**BR-05:** In-person events must contain the required city and venue information.

**BR-06:** Event coordinates must contain valid latitude and longitude values when supplied.

**BR-07:** Booking quantity must be at least one.

**BR-08:** Total booking amount must not be negative.

**BR-09:** Each booking must reference an existing customer and event.

**BR-10:** Each booking must have a unique booking reference.

**BR-11:** Booking status must follow the supported status values.

**BR-12:** Ticket verification must validate the underlying booking or ticket information.

**BR-13:** Used tickets must not be accepted as unused tickets.

**BR-14:** The verification process should record relevant verification details.

**BR-15:** The application must preserve the Pakistan-focused scope of the current project.

---

## 8. System Constraints

1. EventEase requires an active internet connection when accessed through its deployed services.
2. Backend operations depend on the availability of the configured MongoDB database.
3. The application uses the React, Node.js, Express.js and MongoDB technology stack.
4. The application must follow the authorization and validation rules implemented in its backend.
5. The current QR verification workflow accepts uploaded QR images.
6. The current project scope focuses on events in Pakistan.
7. Actual third-party service availability depends on the relevant service provider and deployment configuration.

---

## 9. Acceptance Criteria

The system is considered acceptable when the following criteria are satisfied:

| ID | Acceptance criterion |
|---|---|
| AC-01 | A new user can register successfully with valid information. |
| AC-02 | A registered user can log in with valid credentials. |
| AC-03 | Invalid login credentials are rejected. |
| AC-04 | Protected functionality enforces authentication and permissions. |
| AC-05 | Users can browse available events. |
| AC-06 | Event search and filtering work correctly. |
| AC-07 | Authorized organizers can manage event information. |
| AC-08 | Customers can book eligible event tickets. |
| AC-09 | Booking records contain the correct customer and event references. |
| AC-10 | Booking and digital ticket information can be accessed. |
| AC-11 | Uploaded QR images can be processed for ticket verification. |
| AC-12 | Invalid or already-used tickets are not accepted as unused valid tickets. |
| AC-13 | Relevant dashboards display information according to user permissions. |
| AC-14 | The application works on supported desktop and mobile screen sizes. |
| AC-15 | The deployed application is accessible through its production URL. |

Acceptance criteria should be verified using documented test cases and actual test results.

---

## 10. Future Enhancements

The following items are potential future improvements and are not requirements for the current delivered version:

- Expansion beyond the Pakistan-focused event scope.
- Additional event discovery and recommendation capabilities.
- More advanced reporting and analytics.
- Additional notification and communication features.
- Further performance and scalability improvements.
- Additional integrations with third-party services.

Any future enhancement must be evaluated and documented separately before being treated as an implemented feature.

---

## 11. Conclusion

EventEase provides a centralized web-based solution for event discovery, event management, ticket booking and QR-based ticket verification.

This SRS defines the system's purpose, scope, users, functional requirements, non-functional requirements, database requirements, business rules, constraints and acceptance criteria.

It provides a foundation for understanding, testing, maintaining and improving the EventEase application.

**End of Document**
