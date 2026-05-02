Feature: Course Enrollment
  As a student
  I want to enroll in and unenroll from courses
  So that I can manage my academic schedule

  Background:
    Given the system has the following users:
      | email              | role     |
      | student@uni.pl     | STUDENT  |
      | student2@uni.pl    | STUDENT  |
      | lecturer@uni.pl    | LECTURER |
      | admin@uni.pl       | ADMIN    |
    And the following courses exist:
      | name               | capacity | lecturer         |
      | Algebra Liniowa    | 2        | lecturer@uni.pl  |
      | Analiza Matematyczna | 30     | lecturer@uni.pl  |

  Scenario: [US-006] - Student sees available courses with status
    Given I am logged in as "student@uni.pl"
    And I am enrolled in "Analiza Matematyczna"
    When I view the course list
    Then I see "Algebra Liniowa" with status "dostępny"
    And I see "Analiza Matematyczna" with status "zapisany"
    And I see the number of free spots for each course

  Scenario: [US-006] - Student sees course marked as full
    Given "Algebra Liniowa" has 2/2 spots taken
    And I am logged in as "student@uni.pl"
    When I view the course list
    Then "Algebra Liniowa" is marked as "brak miejsc"

  Scenario: [US-007] - Student successfully enrolls in a course
    Given I am logged in as "student@uni.pl"
    And "Algebra Liniowa" has 1 free spot
    When I enroll in "Algebra Liniowa"
    Then my enrollment is confirmed
    And the free spots count decreases by 1
    And "Algebra Liniowa" appears in my course list

  Scenario: [US-007] - Student cannot enroll in a full course
    Given I am logged in as "student@uni.pl"
    And "Algebra Liniowa" has 0 free spots
    When I attempt to enroll in "Algebra Liniowa"
    Then I receive a clear "brak miejsc" message
    And I am not enrolled

  Scenario: [US-007] - Student cannot enroll twice in the same course
    Given I am logged in as "student@uni.pl"
    And I am already enrolled in "Analiza Matematyczna"
    When I attempt to enroll in "Analiza Matematyczna" again
    Then I receive an "already enrolled" message
    And no duplicate enrollment is created

  Scenario: [US-007] - Race condition: two students competing for last spot
    Given "Algebra Liniowa" has exactly 1 free spot
    When "student@uni.pl" and "student2@uni.pl" both attempt to enroll simultaneously
    Then exactly one enrollment is created
    And the student who was second receives "brak miejsc"
    And the enrolled count does not exceed capacity

  Scenario: [US-008] - Student unenrolls from a course
    Given I am logged in as "student@uni.pl"
    And I am enrolled in "Algebra Liniowa"
    When I unenroll from "Algebra Liniowa"
    Then my enrollment is removed
    And the free spots count increases by 1

  Scenario: [US-008] - Student cannot unenroll from a course they are not in
    Given I am logged in as "student@uni.pl"
    And I am not enrolled in "Algebra Liniowa"
    When I attempt to unenroll from "Algebra Liniowa"
    Then I receive an appropriate error message

  Scenario: [US-009] - Student sees their enrolled courses
    Given I am logged in as "student@uni.pl"
    And I am enrolled in "Algebra Liniowa" and "Analiza Matematyczna"
    When I view "moje kursy"
    Then I see exactly those 2 courses
    And I do not see courses I am not enrolled in

  Scenario: [US-007] - Lecturer cannot enroll as student
    Given I am logged in as "lecturer@uni.pl"
    When I attempt to enroll in "Algebra Liniowa"
    Then I receive HTTP 403
