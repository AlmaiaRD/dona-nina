import { describe, it, expect } from 'vitest'
import { numberToWords } from '../utils'

describe('numberToWords', () => {
  it('returns CERO for 0', () => {
    expect(numberToWords(0)).toBe('CERO PESOS DOMINICANOS CON 00/100')
  })

  it('handles single digits', () => {
    expect(numberToWords(1)).toBe('UN PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(5)).toBe('CINCO PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(9)).toBe('NUEVE PESOS DOMINICANOS CON 00/100')
  })

  it('handles 10-19', () => {
    expect(numberToWords(10)).toBe('DIEZ PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(11)).toBe('ONCE PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(15)).toBe('QUINCE PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(19)).toBe('DIECINUEVE PESOS DOMINICANOS CON 00/100')
  })

  it('handles 20-99', () => {
    expect(numberToWords(20)).toBe('VEINTE PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(21)).toBe('VEINTIÚN PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(22)).toBe('VEINTIDÓS PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(30)).toBe('TREINTA PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(45)).toBe('CUARENTA Y CINCO PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(99)).toBe('NOVENTA Y NUEVE PESOS DOMINICANOS CON 00/100')
  })

  it('handles 100-999', () => {
    expect(numberToWords(100)).toBe('CIEN PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(101)).toBe('CIENTO UN PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(200)).toBe('DOSCIENTOS PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(345)).toBe('TRESCIENTOS CUARENTA Y CINCO PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(999)).toBe('NOVECIENTOS NOVENTA Y NUEVE PESOS DOMINICANOS CON 00/100')
  })

  it('handles thousands', () => {
    expect(numberToWords(1000)).toBe('MIL PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(2000)).toBe('DOS MIL PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(1500)).toBe('MIL QUINIENTOS PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(9999)).toBe('NUEVE MIL NOVECIENTOS NOVENTA Y NUEVE PESOS DOMINICANOS CON 00/100')
  })

  it('handles millions', () => {
    expect(numberToWords(1000000)).toBe('UN MILLÓN PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(2000000)).toBe('DOS MILLONES PESOS DOMINICANOS CON 00/100')
    expect(numberToWords(1500000)).toBe('UN MILLÓN QUINIENTOS MIL PESOS DOMINICANOS CON 00/100')
  })

  it('handles decimals', () => {
    expect(numberToWords(10.50)).toBe('DIEZ PESOS DOMINICANOS CON 50/100')
    expect(numberToWords(1.99)).toBe('UN PESOS DOMINICANOS CON 99/100')
    expect(numberToWords(0.05)).toBe('CERO PESOS DOMINICANOS CON 05/100')
    expect(numberToWords(100.01)).toBe('CIEN PESOS DOMINICANOS CON 01/100')
  })

  it('handles large amounts', () => {
    const result = numberToWords(1234567.89)
    expect(result).toContain('MILLÓN')
    expect(result).toContain('89/100')
  })

  it('handles amounts without decimals', () => {
    expect(numberToWords(500)).toBe('QUINIENTOS PESOS DOMINICANOS CON 00/100')
  })
})
