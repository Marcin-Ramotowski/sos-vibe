Feature: Course Management
  As an admin
  I want to create and manage courses
  So that students can enroll in them

  Background:
    Given the system has the following users:
      | email              | role     |
      | admin@uni.pl       | ADMIN    |
      | lecturer@uni.pl    | LECTURER |
      | student@uni.pl     | STUDENT  |

  Scenario: [US-003] - Admin creates a course successfully
    Given I am logged in as "admin@uni.pl"
    When I create a course with name "Algebra Liniowa", description "Kurs podstaw algebry", capacity 30
    Then the course is created with a unique ID
    And the course appears in the course list

  Scenario: [US-003] - Admin cannot create course with zero capacity
    Given I am logged in as "admin@uni.pl"
    When I create a course with capacity 0
    Then I receive a validation error
    And no course is created

  Scenario: [US-003] - Student cannot create a course
    Given I am logged in as "student@uni.pl"
    When I attempt to create a course
    Then I receive HTTP 403

  Scenario: [US-003] - Lecturer cannot create a course
    Given I am logged in as "lecturer@uni.pl"
    When I attempt to create a course
    Then I receive HTTP 403

  Scenario: [US-004] - Admin assigns lecturer to course
    Given I am logged in as "admin@uni.pl"
    And course "Algebra Liniowa" exists
    When I assign "lecturer@uni.pl" to "Algebra Liniowa"
    Then the course shows "lecturer@uni.pl" as the assigned lecturer

  Scenario: [US-004] - Admin cannot assign student as lecturer
    Given I am logged in as "admin@uni.pl"
    And course "Algebra Liniowa" exists
    When I attempt to assign "student@uni.pl" as lecturer
    Then I receive a validation error

  Scenario: [US-005] - Admin sees paginated course list
    Given I am logged in as "admin@uni.pl"
    And 60 courses exist in the system
    When I request the course list without specifying a page
    Then I receive the first 50 courses
    And the response includes pagination metadata
