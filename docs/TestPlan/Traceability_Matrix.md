\# Requirements Traceability Matrix

\## Chat Application Using Socket Programming and WebSockets



\*\*Document Status:\*\* Preliminary  

\*\*Version:\*\* 1.0  

\*\*Project:\*\* Chat Application Using Socket Programming and WebSockets  

\*\*Prepared By:\*\* Testing Team Member



\---



\## 1. Purpose



The Requirements Traceability Matrix (RTM) establishes a relationship between the functional, non-functional, and security requirements of the chat application and the test cases designed to verify them.



It helps identify which requirements have corresponding test cases and highlights requirements that may require additional testing.



This matrix is preliminary. The actual Software Requirements Specification (SRS) must be reviewed before the requirement identifiers and descriptions can be finalized.



\## 2. Scope



This matrix covers the following proposed application capabilities:



\- User registration and authentication

\- WebSocket connection establishment

\- Sending and receiving messages

\- Communication between multiple users

\- Chat history

\- Online and offline status

\- Client disconnection handling

\- Input validation

\- Unauthorized-access prevention

\- Communication security

\- Response-time observation

\- Connection and messaging stability



These capabilities are based on the project's currently described scope. Their implementation and exact requirements have not yet been verified.



\## 3. Traceability Matrix



\*\*Coverage Status Definitions:\*\*



\- \*\*Preliminary:\*\* A proposed test case exists, but the corresponding SRS requirement has not been confirmed.

\- \*\*Pending Verification:\*\* The requirement and its test case need to be checked against the SRS and implementation.

\- \*\*Not Covered:\*\* No corresponding test case has been identified.



| Requirement ID | Requirement Description | Category | Related Test Case IDs | Coverage Status | Remarks |

|---|---|---|---|---|---|

| TBD-FR-01 | The system should support user registration. | Functional | TC-01 | Preliminary | Confirm registration rules in the SRS. |

| TBD-FR-02 | The system should authenticate users. | Functional | TC-02, TC-03 | Preliminary | Confirm valid and invalid login behavior. |

| TBD-FR-03 | The system should establish a WebSocket connection for an authorized user. | Functional | TC-04 | Preliminary | Confirm connection and authentication behavior. |

| TBD-FR-04 | The system should allow users to send messages. | Functional | TC-05 | Preliminary | Confirm message format and delivery behavior. |

| TBD-FR-05 | The system should deliver messages to intended recipients. | Functional | TC-06, TC-07 | Preliminary | Confirm recipient and multi-user behavior. |

| TBD-FR-06 | The system should retain and retrieve chat history if this feature is implemented. | Functional | TC-08 | Preliminary | Confirm history requirements and persistence rules. |

| TBD-FR-07 | The system should represent user online/offline status if this feature is implemented. | Functional | TC-09 | Preliminary | Confirm presence behavior in the SRS. |

| TBD-FR-08 | The system should handle client disconnections. | Functional | TC-10, TC-15 | Preliminary | Confirm expected recovery and cleanup behavior. |

| TBD-FR-09 | The system should validate incoming message data. | Functional/Security | TC-11 | Preliminary | Confirm input constraints and error handling. |

| TBD-SEC-01 | The system should prevent unauthorized users from accessing protected functionality. | Security | TC-03, TC-12 | Preliminary | Derive the final requirement from the SRS security section. |

| TBD-SEC-02 | Communication should be protected against unauthorized access or exposure. | Security | TC-13 | Preliminary | Confirm the required transport and security mechanisms. |

| TBD-NFR-01 | The system should satisfy defined response-time expectations. | Non-functional | TC-14 | Preliminary | A measurable threshold must be obtained from the SRS. |

| TBD-NFR-02 | The system should maintain reliable connections and messaging under defined conditions. | Non-functional | TC-15 | Preliminary | Define workload, duration, and acceptance criteria. |

| TBD-NFR-03 | The system should handle concurrent users within specified limits. | Non-functional | TC-07, TC-15 | Preliminary | Obtain concurrency targets from the SRS. |



\*\*Note:\*\* The identifiers beginning with `TBD-` are provisional labels for organizing the matrix. They are not confirmed SRS requirement IDs. The descriptions above are proposed summaries and must not be treated as approved requirements.



\## 4. Test Case Coverage Summary



The current preliminary test-case document contains 15 proposed test cases, numbered TC-01 through TC-15.



| Metric | Current Status |

|---|---|

| Proposed test cases | 15 |

| Test cases with confirmed SRS traceability | Pending SRS review |

| Requirements with confirmed identifiers | Pending SRS review |

| Requirements verified through execution | None confirmed |

| Test execution status | Not established by this document |



The number of proposed test cases must not be interpreted as proof of complete requirements coverage.



\## 5. Traceability Validation Procedure



The following activities must be completed before the matrix can be finalized:



1\. Review the approved SRS and identify every functional requirement.

2\. Identify all non-functional requirements, including measurable performance and reliability criteria.

3\. Identify security objectives and security requirements.

4\. Replace the provisional `TBD-` identifiers with the exact identifiers used in the SRS.

5\. Verify that each test case addresses the requirement it is intended to validate.

6\. Add test cases for requirements that currently have no adequate coverage.

7\. Confirm that each test case has explicit preconditions, test data, execution steps, and expected results.

8\. Execute the tests against the implemented application and record actual results separately.

9\. Update the matrix when requirements or test cases change.



\## 6. Bidirectional Traceability



Traceability must work in both directions.



\### 6.1 Forward Traceability



For each requirement, identify one or more test cases that verify it.



This helps detect requirements that have no associated tests.



\### 6.2 Backward Traceability



For each test case, identify the requirement or approved test objective that justifies its existence.



This helps detect test cases that are unrelated to the specified project scope.



Test cases for exploratory testing or general robustness may be linked to approved test objectives where a direct requirement mapping is not appropriate.



\## 7. Limitations and Assumptions



\- The approved SRS has not yet been reconciled with this matrix.

\- Application implementation details have not been verified through this document.

\- Some proposed features may be absent from the final implementation.

\- Exact performance thresholds and concurrency limits remain unspecified here.

\- Security mechanisms must be confirmed against the approved design and implementation.

\- No test execution results are claimed by this matrix.



\## 8. Review and Approval



| Role | Name | Status |

|---|---|---|

| Prepared By | Testing Team Member | Draft |

| Reviewed By | TBD | Pending |

| Approved By | TBD | Pending |



\---



\*\*End of Document\*\*

