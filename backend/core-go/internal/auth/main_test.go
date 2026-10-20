package auth

import (
	"os"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// TestMain lowers the bcrypt work factor for the duration of the suite. At the
// production cost of 12, each of the roughly dozen hash/verify operations in
// these tests costs a quarter second on its own, and several seconds under
// -race, which made this package the slowest thing in CI by an order of
// magnitude. The cost factor is embedded in each hash, so verification at a
// lower cost still exercises the same code path.
func TestMain(m *testing.M) {
	bcryptCost = bcrypt.MinCost
	os.Exit(m.Run())
}

// Guards the production work factor independently of the override above: this
// reads the constant, not the variable, so lowering what ships requires editing
// this test deliberately.
func TestProductionBcryptCostIsSufficient(t *testing.T) {
	if productionBcryptCost < 12 {
		t.Errorf("production bcrypt cost is %d; 12 is the minimum this service should ship", productionBcryptCost)
	}
}
