import { describe, it, expect } from 'vitest'
import { isValidGrade, VALID_GRADES } from '@/domain/entities/grade.entity'

describe('grade entity - isValidGrade', () => {
  it('should accept all valid Polish grades', () => {
    for (const g of VALID_GRADES) {
      expect(isValidGrade(g)).toBe(true)
    }
  })

  it('should reject 1.0', () => {
    expect(isValidGrade(1.0)).toBe(false)
  })

  it('should reject 6.0', () => {
    expect(isValidGrade(6.0)).toBe(false)
  })

  it('should reject intermediate values like 2.5', () => {
    expect(isValidGrade(2.5)).toBe(false)
  })

  it('should reject 3.2', () => {
    expect(isValidGrade(3.2)).toBe(false)
  })

  it('should reject negative numbers', () => {
    expect(isValidGrade(-1)).toBe(false)
  })

  it('should reject 0', () => {
    expect(isValidGrade(0)).toBe(false)
  })

  it('VALID_GRADES should have exactly 7 values', () => {
    expect(VALID_GRADES).toHaveLength(7)
  })

  it('VALID_GRADES should include 2.0 (failing grade)', () => {
    expect(VALID_GRADES).toContain(2.0)
  })

  it('VALID_GRADES should include 5.5 (top grade)', () => {
    expect(VALID_GRADES).toContain(5.5)
  })
})
