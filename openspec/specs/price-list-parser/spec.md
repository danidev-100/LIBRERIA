# Price List Parser Specification

## Purpose

Define the TXT price list parser that reads a fixed-width, ISO-8859-1 encoded file and returns structured product data.

## Requirements

### Requirement: Fixed-Width Field Extraction

The parser MUST extract fields by character position (1-indexed): `code` (10–17), `description` (20–66), `price` (68–75), `lastUpdate` (78–87). The file MUST be decoded using ISO-8859-1 encoding.

#### Scenario: Correct extraction from a valid line

- GIVEN the input line `          1234567  LIBRO DE PRUEBA                   00150.50   20260101`
- WHEN the parser extracts fields
- THEN `code` is `"1234567"`, `description` is `"LIBRO DE PRUEBA"`, `price` is `150.50`, `lastUpdate` is `"20260101"`

#### Scenario: Special characters (ñ, accents)

- GIVEN a line with `AÑOS DE SOLEDAD` in the description field in ISO-8859-1 encoding
- WHEN decoded and parsed
- THEN `description` contains `"AÑOS DE SOLEDAD"` with the correct accented characters

### Requirement: Line Filtering

The parser MUST skip lines that are page headers (contain `"LISTA DE PRECIOS"`), separator lines (contain `"===="`), or are blank.

#### Scenario: Skip header and separator lines

- GIVEN a file with `LISTA DE PRECIOS ACTUALIZADA AL 26/05/2026`, a blank line, `====` line, and one data line
- WHEN parsed
- THEN only 1 product is returned from the data line

### Requirement: Asterisk Stripping

The parser MUST remove trailing asterisks (`*`) from the description field.

#### Scenario: Asterisk in description

- GIVEN a parsed description `"LIBRO CON NOTA*"`
- WHEN cleaned
- THEN the result is `"LIBRO CON NOTA"`

### Requirement: Empty Price Handling

If the price field (positions 68–75) is blank or whitespace-only, the parser MUST set `price` to `0` and `isActive` to `true`.

#### Scenario: Product without price

- GIVEN a line where the price field is all spaces
- WHEN parsed
- THEN `price` is `0` and `isActive` is `true`

### Requirement: Output Contract

The parser MUST return an array of objects conforming to: `code` (string), `description` (string, asterisk stripped), `price` (number, `0` if blank), `lastUpdate` (string), `isActive` (boolean, always `true`).

#### Scenario: Complete parse of three products

- GIVEN a valid TXT with 3 data lines (one no-price)
- WHEN parsed
- THEN an array of 3 objects is returned matching the output contract
- AND one object has `price: 0`
