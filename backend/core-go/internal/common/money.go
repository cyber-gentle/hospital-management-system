package common

import "github.com/shopspring/decimal"

// Money emits an exact JSON number for the frontend's numeric contract without
// ever converting through a binary floating-point value.
type Money struct {
	decimal.Decimal
	Present bool
}

func (m Money) MarshalJSON() ([]byte, error) { return []byte(m.StringFixed(2)), nil }
func (m *Money) UnmarshalJSON(value []byte) error {
	if string(value) == "null" {
		m.Present = false
		return nil
	}
	if err := m.Decimal.UnmarshalJSON(value); err != nil {
		return err
	}
	m.Present = true
	return nil
}
func (m Money) ValidNonnegative() bool {
	return !m.IsNegative() && m.Equal(m.Round(2)) && !m.GreaterThan(decimal.New(999999999999, -2))
}
