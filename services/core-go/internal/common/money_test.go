package common

import (
	"encoding/json"
	"testing"
)

func TestMoneyValidationAndExactJSON(t *testing.T) {
	for _, tc := range []struct {
		input  string
		valid  bool
		output string
	}{
		{`0`, true, `0.00`}, {`0.10`, true, `0.10`}, {`9999999999.99`, true, `9999999999.99`},
		{`-0.01`, false, ``}, {`0.001`, false, ``}, {`10000000000`, false, ``},
	} {
		t.Run(tc.input, func(t *testing.T) {
			var money Money
			if err := json.Unmarshal([]byte(tc.input), &money); err != nil {
				t.Fatal(err)
			}
			if !money.Present || money.ValidNonnegative() != tc.valid {
				t.Fatalf("Unexpected validation for %s", tc.input)
			}
			if tc.valid {
				data, err := json.Marshal(money)
				if err != nil {
					t.Fatal(err)
				}
				if string(data) != tc.output {
					t.Fatalf("Expected %s got %s", tc.output, data)
				}
			}
		})
	}
	var missing Money
	if err := json.Unmarshal([]byte(`null`), &missing); err != nil {
		t.Fatal(err)
	}
	if missing.Present {
		t.Fatal("Null must not count as an explicitly supplied amount")
	}
	for _, bad := range []string{`"NaN"`, `"Infinity"`, `true`, `{}`} {
		var money Money
		if err := json.Unmarshal([]byte(bad), &money); err == nil {
			t.Fatalf("Accepted %s", bad)
		}
	}
}
