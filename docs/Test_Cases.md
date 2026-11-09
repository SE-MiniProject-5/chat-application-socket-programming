\# Test Cases

\## Chat Application using Socket Programming and WebSockets



\*\*Document ID:\*\* TC-001  

\*\*Version:\*\* 1.0  

\*\*Status:\*\* Draft  

\*\*Project:\*\* Chat Application using Socket Programming and WebSockets  

\*\*Prepared By:\*\* Testing Team  

\*\*Date:\*\* October 2026



\---



\## 1. Introduction



\### 1.1 Purpose



This document defines the preliminary test cases for verifying the functional, non-functional, and security-related behaviour of the Chat Application using Socket Programming and WebSockets.



\### 1.2 Scope



The test cases cover the planned functionality of the application, including user authentication, WebSocket connections, messaging, multiple-user communication, chat history, connection handling, and security validation.



\### 1.3 Test Case Status



These test cases are preliminary and are based on the currently documented project scope. Requirement identifiers, expected behaviour, and test data must be reconciled with the finalized Software Requirements Specification (SRS) and implementation.



No test execution result is assumed in this document.



\---



\## 2. Test Case Summary



| Test Case ID | Test Case | Test Type | Priority |

|---|---|---|---|

| TC-01 | User Registration | Functional | High |

| TC-02 | Valid User Authentication | Functional | High |

| TC-03 | Invalid User Authentication | Functional/Security | High |

| TC-04 | WebSocket Connection Establishment | Functional | High |

| TC-05 | Sending a Message | Functional | High |

| TC-06 | Receiving a Message | Functional | High |

| TC-07 | Communication Between Multiple Users | Integration | High |

| TC-08 | Chat History Retrieval | Functional | Medium |

| TC-09 | Online/Offline Status | Functional | Medium |

| TC-10 | Client Disconnection | Functional/Reliability | High |

| TC-11 | Invalid Message Input | Negative/Security | High |

| TC-12 | Unauthorized Access | Security | High |

| TC-13 | Communication Security | Security | High |

| TC-14 | Response Time Observation | Performance | Medium |

| TC-15 | Connection and Messaging Stability | Reliability | Medium |



\---



\## 3. Detailed Test Cases



\### TC-01: User Registration



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that a new user can register using valid registration details.



\*\*Preconditions:\*\*

1\. The application and its required services are running.

2\. The registration interface is available.

3\. The test username or account does not already exist.



\*\*Test Data:\*\*

\- Username: `testuser01`

\- Password: A valid test password meeting the application's documented password rules.



\*\*Test Steps:\*\*

1\. Open the registration interface.

2\. Enter the test username.

3\. Enter a valid password and any other required registration fields.

4\. Submit the registration form.

5\. Observe the response.



\*\*Expected Result:\*\*  

The application accepts the registration if the supplied details satisfy the documented requirements. It displays the appropriate success response and makes the account available for authentication.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Confirm the registration workflow and required fields against the SRS.



\---



\### TC-02: Valid User Authentication



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that a registered user can authenticate using valid credentials.



\*\*Preconditions:\*\*

1\. The application is running.

2\. A registered test account exists.

3\. The user is logged out.



\*\*Test Data:\*\*

\- Username: A valid registered test username.

\- Password: The corresponding valid password.



\*\*Test Steps:\*\*

1\. Open the login interface.

2\. Enter the registered username.

3\. Enter the corresponding password.

4\. Submit the login form.

5\. Observe the authentication result.



\*\*Expected Result:\*\*  

The application accepts valid credentials and establishes the authenticated state specified by the SRS.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Record the resulting screen or response.



\---



\### TC-03: Invalid User Authentication



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional/Security  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that invalid credentials do not grant access to an authenticated session.



\*\*Preconditions:\*\*

1\. The application is running.

2\. The user is logged out.

3\. The login interface is available.



\*\*Test Data:\*\*

\- Username: A nonexistent test username.

\- Password: An incorrect password.



\*\*Test Steps:\*\*

1\. Open the login interface.

2\. Enter the invalid credentials.

3\. Submit the login form.

4\. Observe the response.

5\. Attempt to access a feature restricted to authenticated users.



\*\*Expected Result:\*\*  

Authentication is rejected, and protected functionality remains inaccessible without a valid authenticated session.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Verify the rejection behaviour against the SRS.



\---



\### TC-04: WebSocket Connection Establishment



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional/Integration  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that a client can establish a WebSocket connection with the server.



\*\*Preconditions:\*\*

1\. The server is running.

2\. The client is configured with the correct server endpoint.

3\. Required network connectivity is available.



\*\*Test Data:\*\*

\- Valid WebSocket endpoint configured for the test environment.



\*\*Test Steps:\*\*

1\. Start the server if it is not already running.

2\. Launch the client.

3\. Initiate the WebSocket connection.

4\. Observe the connection result.

5\. Verify that the client can communicate through the established connection.



\*\*Expected Result:\*\*  

The client establishes a WebSocket connection and can exchange data as specified by the application protocol.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Record the endpoint and environment used.



\---



\### TC-05: Sending a Message



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that a user can send a valid text message through the application.



\*\*Preconditions:\*\*

1\. The server is running.

2\. A user is authenticated if authentication is required.

3\. The client has an active connection.

4\. The target recipient or chat is available.



\*\*Test Data:\*\*

\- Message: `Hello, this is a test message.`



\*\*Test Steps:\*\*

1\. Open the chat interface.

2\. Select the intended recipient or chat.

3\. Enter the test message.

4\. Send the message.

5\. Observe the application response.



\*\*Expected Result:\*\*  

The application accepts and processes the message according to the specified messaging behaviour.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Message delivery is verified separately in TC-06.



\---



\### TC-06: Receiving a Message



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional/Integration  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that a recipient receives a message sent by another user.



\*\*Preconditions:\*\*

1\. The server is running.

2\. Two test clients are connected.

3\. The sender and recipient satisfy the application's authentication requirements.

4\. The sender and recipient are participating in a supported chat.



\*\*Test Data:\*\*

\- Message: `Message delivery verification 001`



\*\*Test Steps:\*\*

1\. Open the sender client.

2\. Open the recipient client.

3\. Send the test message from the sender.

4\. Observe the recipient client.

5\. Compare the received message with the sent message.



\*\*Expected Result:\*\*  

The recipient receives the correct message according to the application's delivery requirements.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Record any delay, duplication, or message-content discrepancy.



\---



\### TC-07: Communication Between Multiple Users



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional/Integration  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that multiple connected users can communicate without unintended interference between their messages.



\*\*Preconditions:\*\*

1\. The server is running.

2\. At least three test clients can connect.

3\. The required users and chat sessions are configured.



\*\*Test Data:\*\*

\- Client A message: `Message from A`

\- Client B message: `Message from B`



\*\*Test Steps:\*\*

1\. Connect Clients A, B, and C.

2\. Establish the required chat or recipient relationships.

3\. Send a message from Client A.

4\. Record which clients receive it.

5\. Send a message from Client B.

6\. Record which clients receive it.

7\. Compare the results with the application's specified message-routing rules.



\*\*Expected Result:\*\*  

Messages are delivered to the intended recipients according to the application's messaging and chat-membership rules.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Confirm whether the application supports direct messages, group chats, or both.



\---



\### TC-08: Chat History Retrieval



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional  

\*\*Priority:\*\* Medium



\*\*Objective:\*\*  

Verify that previous messages can be retrieved when chat-history persistence is supported.



\*\*Preconditions:\*\*

1\. The application is running.

2\. A test account and chat are available.

3\. The chat-history feature is implemented.

4\. At least one test message has been sent and stored.



\*\*Test Data:\*\*

\- Message: `Chat history verification 001`



\*\*Test Steps:\*\*

1\. Log in using the test account.

2\. Open the relevant chat.

3\. Send a unique test message.

4\. Close the chat or leave the application.

5\. Reopen the application or chat.

6\. Check whether the previous message is available.



\*\*Expected Result:\*\*  

Previously stored messages are retrieved and displayed according to the chat-history requirements.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* If persistent chat history is not implemented or specified, mark this test NOT APPLICABLE after confirming the scope.



\---



\### TC-09: Online/Offline Status



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional  

\*\*Priority:\*\* Medium



\*\*Objective:\*\*  

Verify that the application represents user presence correctly.



\*\*Preconditions:\*\*

1\. The server is running.

2\. Two test accounts are available.

3\. The online/offline status feature is implemented.



\*\*Test Data:\*\*

\- User A: Test account whose connection state can be changed.

\- User B: Test account used to observe presence.



\*\*Test Steps:\*\*

1\. Log in as User A.

2\. Observe User A's status from User B's client.

3\. Disconnect User A using the supported procedure.

4\. Observe the status again.

5\. Compare both observations with the documented presence rules.



\*\*Expected Result:\*\*  

The displayed presence state reflects the connection or availability rules specified by the application.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Account for any presence-update delay permitted by the SRS.



\---



\### TC-10: Client Disconnection



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Functional/Reliability  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that the application handles client disconnection without leaving the client in an incorrect connection state.



\*\*Preconditions:\*\*

1\. The server is running.

2\. A client has an active connection.



\*\*Test Data:\*\*

\- One connected test client.



\*\*Test Steps:\*\*

1\. Establish a client connection.

2\. Close the client or terminate the connection using a supported method.

3\. Observe the client and server behaviour.

4\. Check whether connection resources are released as expected.

5\. If supported, reconnect the client.



\*\*Expected Result:\*\*  

The application detects or handles the disconnection according to its connection-management requirements. Reconnection behaves as specified.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Record server errors, stale presence information, or unsuccessful reconnection.



\---



\### TC-11: Invalid Message Input



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Negative/Security  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that invalid or unsupported message input is handled safely.



\*\*Preconditions:\*\*

1\. The application is running.

2\. The client can access the message-input interface.



\*\*Test Data:\*\*

\- Empty message.

\- Message containing unsupported input.

\- Message at or beyond the documented size limit, where such a limit exists.



\*\*Test Steps:\*\*

1\. Attempt to submit an empty message.

2\. Observe the response.

3\. Submit an unsupported or malformed message.

4\. If a maximum message size is specified, test the documented boundary and an input exceeding it.

5\. Observe the application's behaviour and any server-side errors.



\*\*Expected Result:\*\*  

Inputs are accepted or rejected according to the documented validation rules. Invalid input does not cause unintended behaviour or an unhandled application failure.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Do not assume an input limit until it is documented.



\---



\### TC-12: Unauthorized Access



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Security  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that protected application functionality cannot be accessed without the required authorization.



\*\*Preconditions:\*\*

1\. The application is running.

2\. A protected feature exists.

3\. The test client is unauthenticated or lacks the required authorization.



\*\*Test Data:\*\*

\- Unauthenticated test client.

\- Protected endpoint or action identified from the implementation.



\*\*Test Steps:\*\*

1\. Start a client without establishing a valid authenticated session.

2\. Attempt to access the protected feature.

3\. Observe the response.

4\. If the application supports authenticated sessions, repeat using an invalid or expired session where applicable.

5\. Verify whether access is granted or denied.



\*\*Expected Result:\*\*  

The application prevents access that is not permitted by its authentication and authorization rules.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Perform only against the authorized project test environment.



\---



\### TC-13: Communication Security



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Security  

\*\*Priority:\*\* High



\*\*Objective:\*\*  

Verify that client-server communication uses the security mechanisms required by the project.



\*\*Preconditions:\*\*

1\. The application is running in the test environment.

2\. The required communication-security configuration is documented.

3\. Appropriate inspection tools are available.



\*\*Test Data:\*\*

\- A test account.

\- A non-sensitive test message: `Security validation message`.



\*\*Test Steps:\*\*

1\. Review the communication-security requirements in the SRS.

2\. Establish a client-server connection.

3\. Inspect the connection configuration and protocol.

4\. Verify whether the required transport protection is enabled.

5\. Check that the configuration matches the security requirements.

6\. Record any mismatch.



\*\*Expected Result:\*\*  

The connection satisfies the communication-security requirements documented in the SRS.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Do not assume that WebSocket use alone provides transport encryption. The required configuration must be established from the SRS.



\---



\### TC-14: Response Time Observation



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Non-functional/Performance  

\*\*Priority:\*\* Medium



\*\*Objective:\*\*  

Measure message-delivery response time under a documented test configuration.



\*\*Preconditions:\*\*

1\. The server is running.

2\. At least two clients can communicate.

3\. The test environment is documented.

4\. A timing method is available.



\*\*Test Data:\*\*

\- A fixed test message.

\- A recorded client count.

\- A recorded network and machine configuration.



\*\*Test Steps:\*\*

1\. Connect the sender and recipient.

2\. Record the start time when the sender submits the message.

3\. Record the time when the recipient receives it.

4\. Calculate the observed delivery time.

5\. Repeat the measurement under the same conditions.

6\. Record the measurements and test configuration.



\*\*Expected Result:\*\*  

The measured results are recorded and compared with the performance thresholds specified in the SRS.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* Do not declare PASS or FAIL until an applicable acceptance threshold has been established.



\---



\### TC-15: Connection and Messaging Stability



\*\*Requirement ID:\*\* TBD-SRS  

\*\*Test Type:\*\* Non-functional/Reliability  

\*\*Priority:\*\* Medium



\*\*Objective:\*\*  

Observe whether the application continues to operate correctly during repeated connections and message exchanges.



\*\*Preconditions:\*\*

1\. The server is running.

2\. At least one client can connect.

3\. A repeatable test procedure is available.



\*\*Test Data:\*\*

\- A fixed set of test messages.

\- A documented number of connection and messaging iterations.



\*\*Test Steps:\*\*

1\. Connect the client to the server.

2\. Send and receive test messages.

3\. Disconnect the client using a supported method.

4\. Repeat the connection and messaging sequence.

5\. Observe failures, unexpected disconnections, or server errors.

6\. Record the number of successful and unsuccessful iterations.



\*\*Expected Result:\*\*  

The application behaves according to the reliability and stability requirements defined in the SRS.



\*\*Actual Result:\*\* Not executed  

\*\*Status:\*\* NOT RUN  

\*\*Evidence:\*\* TBD  

\*\*Remarks:\*\* The iteration count and acceptance threshold must be defined before formal execution.



\---



\## 4. Test Execution Record



The following fields must be completed when a test is executed:



| Field | Value |

|---|---|

| Test Case ID | TBD |

| Execution Date | TBD |

| Tester | TBD |

| Environment | TBD |

| Actual Result | TBD |

| Status | NOT RUN |

| Evidence Location | TBD |

| Related Defect ID | TBD |

| Remarks | TBD |



\---



\## 5. Execution Status Definitions



| Status | Definition |

|---|---|

| NOT RUN | The test has not been executed. |

| PASS | The observed result satisfies the applicable acceptance criteria. |

| FAIL | The observed result violates an applicable requirement or acceptance criterion. |

| BLOCKED | Execution cannot proceed because of an unresolved dependency or environment issue. |

| NOT APPLICABLE | The feature is confirmed to be outside the finalized project scope. |



\---



\## 6. Requirement Traceability



All requirement identifiers are provisional until the SRS is finalized.



Each test case will be mapped to its corresponding functional, non-functional, or security requirement in the Traceability Matrix.



The mapping will be reviewed whenever requirements or implementation behaviour change.



\---



\## 7. Approval



| Role | Name | Signature | Date |

|---|---|---|---|

| Testing Lead | TBD | TBD | TBD |

| Project Lead | TBD | TBD | TBD |

| Faculty/Reviewer | TBD | TBD | TBD |s

