Feature: Grade Management
  As a lecturer
  I want to assign and update grades for students in my courses
  So that students can see their academic results

  Background:
    Given the system has the following users:
      | email              | role     |
      | student@uni.pl     | STUDENT  |
      | student2@uni.pl    | STUDENT  |
      | lecturer@uni.pl    | LECTURER |
      | lecturer2@uni.pl   | LECTURER |
      | admin@uni.pl       | ADMIN    |
    And the following courses exist:
      | name               | lecturer        |
      | Algebra Liniowa    | lecturer@uni.pl |
      | Analiza Mat.       | lecturer2@uni.pl|
    And "student@uni.pl" is enrolled in "Algebra Liniowa"

  Scenario: [US-010] - Lecturer sees students in their course
    Given I am logged in as "lecturer@uni.pl"
    When I view students in "Algebra Liniowa"
    Then I see "student@uni.pl" with status "brak oceny"

  Scenario: [US-010] - Lecturer cannot view students in another lecturer's course
    Given I am logged in as "lecturer2@uni.pl"
    When I attempt to view students in "Algebra Liniowa"
    Then I receive HTTP 403

  Scenario: [US-011] - Lecturer assigns a valid grade
    Given I am logged in as "lecturer@uni.pl"
    When I assign grade 4.5 to "student@uni.pl" in "Algebra Liniowa"
    Then the grade is saved
    And an audit log entry is created with old_value=null, new_value=4.5, changed_by="lecturer@uni.pl"
    And the student can see the grade

  Scenario: [US-011] - Lecturer updates an existing grade
    Given I am logged in as "lecturer@uni.pl"
    And "student@uni.pl" has grade 4.5 in "Algebra Liniowa"
    When I update the grade to 5.0
    Then the grade is updated to 5.0
    And an audit log entry is created with old_value=4.5, new_value=5.0

  Scenario: [US-011] - Lecturer cannot assign invalid grade
    Given I am logged in as "lecturer@uni.pl"
    When I attempt to assign grade 3.7 to "student@uni.pl" in "Algebra Liniowa"
    Then I receive a validation error
    And no grade is saved

  Scenario: [US-011] - Lecturer cannot grade student in another course
    Given I am logged in as "lecturer2@uni.pl"
    When I attempt to grade "student@uni.pl" in "Algebra Liniowa"
    Then I receive HTTP 403

  Scenario: [US-011] - Student cannot assign grades
    Given I am logged in as "student@uni.pl"
    When I attempt to assign a grade to any student
    Then I receive HTTP 403

  Scenario: [US-012] - Student views their own grades
    Given I am logged in as "student@uni.pl"
    And I have grade 4.5 in "Algebra Liniowa"
    When I view my grades
    Then I see "Algebra Liniowa" with grade 4.5

  Scenario: [US-012] - Student cannot view another student's grades
    Given I am logged in as "student@uni.pl"
    When I attempt to access grades of "student2@uni.pl"
    Then I receive HTTP 403

  Scenario: [US-012] - Student sees "no grade" for courses without a grade
    Given I am logged in as "student@uni.pl"
    And I am enrolled in "Algebra Liniowa" with no grade assigned
    When I view my grades
    Then I see "Algebra Liniowa" with status "brak oceny"
