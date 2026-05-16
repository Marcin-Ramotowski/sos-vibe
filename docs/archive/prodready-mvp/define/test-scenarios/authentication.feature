Feature: Authentication
  As a user of the SOS system
  I want to log in and log out securely
  So that only authorized users can access the system

  Background:
    Given the system has the following users:
      | email                  | role     |
      | student@uni.pl         | STUDENT  |
      | lecturer@uni.pl        | LECTURER |
      | admin@uni.pl           | ADMIN    |

  Scenario: [US-001] - Successful login as student
    Given I am on the login page
    When I submit email "student@uni.pl" and correct password
    Then I receive a valid session token
    And I am redirected to the student dashboard

  Scenario: [US-001] - Successful login as lecturer
    Given I am on the login page
    When I submit email "lecturer@uni.pl" and correct password
    Then I receive a valid session token
    And I am redirected to the lecturer dashboard

  Scenario: [US-001] - Login with wrong password
    Given I am on the login page
    When I submit email "student@uni.pl" and an incorrect password
    Then I receive a generic error message
    And I do not receive a session token

  Scenario: [US-001] - Login with non-existent email
    Given I am on the login page
    When I submit email "nobody@uni.pl" and any password
    Then I receive the same generic error message as wrong password
    And I do not receive a session token

  Scenario: [US-001] - Access protected resource without token
    Given I have no session token
    When I request a protected resource
    Then I receive HTTP 401

  Scenario: [US-002] - Logout invalidates session
    Given I am logged in as "student@uni.pl"
    When I log out
    Then my session token is invalidated
    And a subsequent request with the old token returns HTTP 401
