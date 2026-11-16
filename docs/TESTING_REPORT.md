# EventEase — Software Testing Report

**Project:** EventEase — Event Management & Ticketing System
**Document:** Software Testing Report
**Version:** 1.0
**Status:** Academic project testing documentation
**Platform:** Web application
**Frontend:** React
**Backend:** Node.js and Express.js
**Database:** MongoDB
**Deployment:** Vercel
**Project Scope:** Pakistan-focused event discovery and ticket management

---

## 1. Introduction

This document describes the software testing approach used for EventEase, a web-based event management and ticketing system. It records the major functional areas tested, expected system behavior, reported test outcomes, and areas requiring final evidence or verification.

The purpose of this report is to demonstrate that the application has been evaluated against its main requirements and to provide a structured record for academic review and future maintenance.

### 1.1 Testing Objectives

The objectives of testing are to:

- Verify that users can register, log in, and access the application.
- Check that authentication and authorization behave correctly.
- Verify event discovery, searching, filtering, and event details.
- Check ticket booking and booking information.
- Evaluate QR ticket verification using uploaded QR images.
- Check database interactions and data consistency.
- Verify the deployed website and its communication with the backend.
- Identify defects and reduce the risk of failures during normal use.

### 1.2 Testing Scope

The testing scope includes:

1. User registration and login.
2. Authentication and session handling.
3. User roles and access control.
4. Event discovery and event information.
5. Search and filtering.
6. Event management.
7. Ticket booking and booking records.
8. QR image upload and ticket verification.
9. Database operations.
10. API communication.
11. Deployment and cross-device behavior.
12. Basic security and error handling.

### 1.3 Out of Scope

The following are not claimed as completed tests in this report:

- Payment gateway transaction testing.
- Live camera-based QR scanning. EventEase uses uploaded QR images.
- International event discovery and international deployment.
- Formal penetration testing by an independent security auditor.
- Formal load testing or a certified performance benchmark.

---

## 2. Testing Methodology

EventEase was evaluated using a combination of functional testing, integration testing, system testing, security-oriented checks, and deployment verification.

### 2.1 Functional Testing

Functional testing checks whether a feature produces the expected result when a user interacts with it.

Examples include registering an account, logging in, searching for events, and creating a booking.

### 2.2 Integration Testing

Integration testing checks whether different parts of the application communicate correctly.

Examples include:

- React frontend communicating with the Express backend.
- Backend API endpoints communicating with MongoDB.
- Authentication middleware validating access tokens.
- Booking operations retrieving the related event and customer records.

### 2.3 System Testing

System testing evaluates the application as a complete system rather than testing individual functions in isolation.

It includes navigating the deployed application and checking whether its main workflows work together.

### 2.4 Security-Oriented Testing

Security-oriented checks examine common application risks, including invalid login credentials, protected routes, authentication tokens, and unauthorized access.

These checks do not replace a professional penetration test or a complete security audit.

### 2.5 Deployment Testing

Deployment testing checks the live application after deployment, including access to the website and the availability of the application's main workflows.

---

## 3. Test Environment

| Component | Environment |
|---|---|
| Operating system used during development | Windows |
| Development editor | Visual Studio Code |
| Frontend | React |
| Backend | Node.js and Express.js |
| Database | MongoDB |
| Database management tool | MongoDB Compass |
| Version control | Git and GitHub |
| Frontend/backend hosting | Vercel |
| Browser used during development | Google Chrome |
| QR verification method | Uploaded QR image |

**Live frontend URL:** https://event-ease-44xo.vercel.app/

The production environment uses configured deployment environment variables. Secret values, database credentials, and authentication keys are intentionally excluded from this report.

---

## 4. Functional Test Cases

The following table records the principal functional test cases. Results marked **Reported Pass** reflect tests previously reported as successful by the project developer. They are not an independent laboratory certification.

| Test ID | Test case | Expected result | Recorded result |
|---|---|---|---|
| TC-01 | Register a new user with valid information | Account is created successfully | Reported Pass |
| TC-02 | Log in using valid credentials | User is authenticated and receives access | Reported Pass |
| TC-03 | Log in using an incorrect password | Login is rejected with an appropriate error | Reported Pass |
| TC-04 | Authenticate using the configured token mechanism | Successful login returns an authentication token | Reported Pass |
| TC-05 | Check login/session behavior after refreshing the page | Session behavior follows the implemented authentication design | Reported Pass |
| TC-06 | Search for an event by its name | Matching events are displayed | Reported Pass |
| TC-07 | Apply event category/type filters | Only matching events are displayed | Reported Pass |
| TC-08 | Test the implemented search and filter scenarios | Results match the selected search and filter conditions | Reported Pass — five scenarios |
| TC-09 | Open an event's details | Relevant event information is displayed | Reported complete |
| TC-10 | Create a ticket booking | Booking is created and its information is available | Requires final evidence |
| TC-11 | Review booking information | The correct booking details are displayed | Requires final evidence |
| TC-12 | Upload a valid ticket QR image | The system verifies a valid ticket according to its rules | Requires final evidence |
| TC-13 | Upload an invalid or unrelated QR image | The system rejects the image or ticket appropriately | Requires final evidence |
| TC-14 | Check event availability after booking | Availability reflects the booking according to the implemented rules | Requires final evidence |
| TC-15 | Access the deployed website | The website loads successfully | Reported Pass |

**Interpretation:** “Requires final evidence” does not mean that a feature is defective. It means that a specific result has not been established sufficiently in the available test record to label it as a confirmed pass.

---

## 5. Authentication Testing

Authentication is important because EventEase supports different user roles and protected application functionality.

### 5.1 Registration Testing

The registration workflow was checked using valid account information.

Expected behavior:

1. The user submits registration information.
2. The frontend sends the request to the backend.
3. The backend validates the submitted information.
4. The account is stored in MongoDB when the request is valid.
5. The application returns an appropriate response.

**Recorded result:** Account creation was previously reported as successful.

### 5.2 Login Testing

The login workflow was checked using valid and invalid credentials.

Expected behavior:

- Valid credentials should authenticate the user.
- Invalid credentials should be rejected.
- The response should not expose sensitive password information.
- Successful authentication should use the application's configured token mechanism.

**Recorded result:** Successful login and incorrect-password rejection were previously reported as working.

### 5.3 Session and Token Testing

The authentication implementation uses JSON Web Tokens (JWT).

The project developer previously reported that both authentication-related tests passed after updating the JWT configuration and checking refresh behavior.

**Recorded result:** Reported Pass.

---

## 6. Event Management Testing

EventEase supports event discovery and event information workflows.

The following behaviors are relevant to event management testing:

- Displaying available events.
- Viewing event information.
- Searching for events.
- Filtering events using available filter options.
- Displaying event availability and other relevant details.
- Allowing authorized users to perform the event-management actions implemented for their role.

The developer previously reported that event details were implemented and that the search and filter test scenarios passed.

**Recorded result:** Event details and five search/filter scenarios were reported as successful.

A final evidence-based submission should include screenshots of event listings, event details, and the search/filter results.

---

## 7. Booking and Ticket Testing

Booking testing evaluates the workflow that connects a customer, an event, and a booking record.

The booking data model includes references to the event and customer, booking quantity, total amount, booking reference, and booking status.

### 7.1 Important Booking Checks

| Test ID | Check | Expected result |
|---|---|---|
| BT-01 | Submit a booking with valid information | Booking is accepted |
| BT-02 | Submit a booking with an invalid quantity | Invalid quantity is rejected |
| BT-03 | Review a booking reference | A booking reference is available |
| BT-04 | Review booking status | The correct status is displayed |
| BT-05 | Check event availability | Availability is handled consistently |
| BT-06 | Attempt to access another user's restricted booking | Access is denied where required |

These checks are included as the required booking test checklist. Their individual outcomes should be recorded from the final execution rather than assumed.

### 7.2 Booking Data Integrity

Booking records are associated with customer and event records through MongoDB ObjectId references.

Testing should confirm that:

- A booking refers to an existing event.
- A booking refers to the correct customer.
- Quantity and total amount are valid.
- Booking references are unique.
- Booking status changes follow the implemented business rules.

---

## 8. QR Ticket Verification Testing

EventEase supports ticket verification using an uploaded QR image.

**Important:** The documented verification method is image upload. This report does not claim live camera scanning functionality.

### 8.1 QR Verification Test Cases

| Test ID | Scenario | Expected result | Recorded result |
|---|---|---|---|
| QR-01 | Upload a QR image belonging to a valid ticket | Ticket is accepted if it satisfies verification rules | Requires final evidence |
| QR-02 | Upload an invalid QR image | Ticket is rejected | Requires final evidence |
| QR-03 | Upload an unrelated QR image | Ticket is not accepted as a valid EventEase ticket | Requires final evidence |
| QR-04 | Attempt to verify a ticket that has already been used | Duplicate use is rejected if the ticket has already been marked Used | Requires final evidence |
| QR-05 | Verify a cancelled ticket | Cancelled ticket is rejected | Requires final evidence |
| QR-06 | Upload an unsupported or unreadable image | An appropriate validation error is displayed | Requires final evidence |

### 8.2 Verification Rules

The expected verification behavior should respect the application's booking and ticket status rules.

For example:

- A valid confirmed ticket may be accepted.
- An invalid ticket must not be accepted.
- A cancelled ticket must not be accepted.
- A previously used ticket must not be accepted again when the single-use rule applies.
- Successful verification should update the booking status and verification information according to the implemented workflow.

The final test evidence should show at least one valid ticket verification and one invalid-ticket rejection.

---

## 9. Database Testing

MongoDB is used to store application data.

The main Mongoose models documented for EventEase are:

1. **User** — stores user and authentication-related information.
2. **Event** — stores event details and event-management information.
3. **Booking** — stores customer bookings and ticket-related information.

### 9.1 Database Test Checklist

| Test ID | Test | Expected result |
|---|---|---|
| DB-01 | Create a user record | Valid user data is stored |
| DB-02 | Create an event record | Valid event data is stored |
| DB-03 | Create a booking record | Valid booking data is stored |
| DB-04 | Retrieve event information | Correct event data is returned |
| DB-05 | Retrieve customer booking information | Correct booking records are returned |
| DB-06 | Submit data that violates schema validation | Invalid data is rejected |
| DB-07 | Check unique booking references | Duplicate references are prevented |
| DB-08 | Check relationships between records | References point to the intended records |

These cases describe the required database validation checks. Individual pass results should be entered only after reviewing execution evidence.

---

## 10. Security Testing

Security-oriented checks are important because EventEase handles user accounts, booking information, and role-based functionality.

### 10.1 Security Checklist

| Test ID | Security check | Expected behavior |
|---|---|---|
| SEC-01 | Submit incorrect login credentials | Authentication is rejected |
| SEC-02 | Access a protected endpoint without authentication | Request is rejected |
| SEC-03 | Submit an invalid or expired token | Request is rejected |
| SEC-04 | Attempt an unauthorized role-specific action | Access is denied |
| SEC-05 | Inspect public API responses | Sensitive credentials are not exposed |
| SEC-06 | Check production configuration | Secret values are stored outside committed source code |
| SEC-07 | Submit invalid input | Validation prevents unacceptable data |
| SEC-08 | Attempt to access another user's protected information | Authorization rules are enforced |

The developer previously reported completing the project's functional, security, and cross-device testing stage. However, individual security test evidence should be retained for academic submission.

This report does not claim that an independent penetration test has been performed.

---

## 11. Integration Testing

Integration testing focuses on the communication between the frontend, backend, database, and supporting services.

| Test ID | Integration area | Expected behavior |
|---|---|---|
| INT-01 | React frontend to Express backend | API requests receive appropriate responses |
| INT-02 | Express backend to MongoDB | Database operations succeed for valid requests |
| INT-03 | Login endpoint to authentication mechanism | Successful login returns the configured authentication response |
| INT-04 | Booking workflow to database | Booking information is stored and retrieved correctly |
| INT-05 | Event workflow to database | Event information is retrieved correctly |
| INT-06 | Protected API to authentication middleware | Access is controlled according to authentication |
| INT-07 | Deployed frontend to deployed backend | Production requests reach the configured backend |

The project developer previously confirmed successful frontend/backend communication during development and reported that the live application was deployed.

Specific production API integration evidence should be retained separately if required by the evaluator.

---

## 12. Cross-Device and Browser Testing

Cross-device testing checks whether the application remains usable on different screen sizes and supported browsers.

The project developer previously reported completing the cross-device testing stage.

The final evidence checklist should include:

- Desktop layout.
- Tablet-sized layout.
- Mobile-sized layout.
- Navigation and menu behavior.
- Event listing layout.
- Authentication form layout.
- Booking and ticket information layout.
- QR image upload interface.

No specific browser compatibility percentage or device performance score is claimed in this report.

---

## 13. Deployment Testing

The EventEase frontend is deployed at:

https://event-ease-44xo.vercel.app/

The developer reported that the website was live and that deployment verification was completed.

### 13.1 Deployment Verification Checklist

| Test ID | Check | Expected result |
|---|---|---|
| DEP-01 | Open the production website | Website loads |
| DEP-02 | Navigate through the main pages | Pages load as intended |
| DEP-03 | Open authentication functionality | Authentication interface is available |
| DEP-04 | Access event discovery | Event interface is available |
| DEP-05 | Check frontend/backend configuration | Production API configuration is used |
| DEP-06 | Check production database connectivity | Backend can access its configured database |
| DEP-07 | Refresh a production page | Application behaves as intended |

**Recorded deployment result:** The live website and deployment verification were previously reported as successful. Individual production test evidence should be attached where available.

---

## 14. Defect Management

A defect is an observed difference between the actual system behavior and the expected behavior.

During development, issues were investigated and corrected as part of the development and testing process.

A defect record should include:

- Defect ID.
- Date identified.
- Affected feature.
- Steps to reproduce.
- Expected result.
- Actual result.
- Severity.
- Corrective action.
- Retest result.

No unverified claim is made here that every possible defect has been eliminated.

### 14.1 Defect Status

| Status | Meaning |
|---|---|
| Open | Defect still requires investigation |
| In Progress | Correction is being implemented |
| Fixed | A correction has been implemented |
| Retested | The correction has been tested again |
| Closed | The defect is considered resolved |

---

## 15. Overall Testing Summary

Based on the project developer's previously reported progress:

- User registration and login tests were reported successful.
- Invalid-password handling was reported successful.
- Authentication token and refresh-related tests were reported successful.
- Five search and filter scenarios were reported successful.
- Event details functionality was reported implemented.
- The project-wide functional, security, and cross-device testing stage was reported completed.
- The application was reported deployed and live.

However, the available record does not contain independent execution logs or screenshots for every individual test case in this document. Booking, QR verification, database integrity, and detailed production checks should be supported with final evidence before assigning them individual confirmed pass results.

### 15.1 Final Test Status

| Testing area | Summary |
|---|---|
| Authentication | Reported successful |
| Search and filtering | Five scenarios reported successful |
| Event details | Reported implemented |
| General functional testing | Reported completed |
| Security testing | Project testing stage reported completed; individual evidence should be retained |
| Cross-device testing | Reported completed |
| Booking and ticket verification | Individual evidence required in this report |
| Database integrity | Individual evidence required in this report |
| Deployment | Live deployment reported successful |

---

## 16. Recommendations

The following recommendations can improve the reliability and maintainability of EventEase:

1. Maintain screenshots and logs for important test cases.
2. Repeat critical tests after major code changes.
3. Test invalid input and unauthorized access.
4. Verify that a ticket cannot be reused when the single-use rule applies.
5. Check database records after booking and verification operations.
6. Monitor the deployed application for backend or database errors.
7. Consider automated API tests and regression testing.
8. Perform formal load and security testing before a larger production rollout.

---

## 17. Conclusion

Testing is an essential part of the EventEase development process. The project has undergone functional, authentication, search/filter, security-oriented, cross-device, and deployment testing as reported by its developer.

The testing process is intended to verify that the major workflows operate correctly and that the application behaves consistently across its frontend, backend, and database components.

This report provides a structured record of the testing approach, known reported outcomes, and additional evidence requirements. It can be used as part of the academic documentation for the EventEase Event Management & Ticketing System.

**End of Document**