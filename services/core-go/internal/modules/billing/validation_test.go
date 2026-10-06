package billing

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

func TestPositiveMoneyValidation(t *testing.T) {
	for _, value := range []string{"-100", "0", "1.001", "10000000000"} {
		t.Run(value, func(t *testing.T) {
			if validateAmount(decimal.RequireFromString(value), true) == nil {
				t.Fatalf("accepted invalid collected amount %s", value)
			}
		})
	}
	for _, value := range []string{"0.01", "10.00", "9999999999.99"} {
		if err := validateAmount(decimal.RequireFromString(value), true); err != nil {
			t.Fatalf("rejected valid amount %s: %v", value, err)
		}
	}
}

func TestInvoiceRejectsInvalidCoverageAndDiscount(t *testing.T) {
	req := CreateInvoiceRequest{LineItems: []CreateLineItemRequest{{Description: "Synthetic consultation", Department: "TEST", Quantity: 1, UnitPrice: decimal.NewFromInt(100), NHIACoveredAmount: decimal.NewFromInt(101)}}}
	if validateInvoice(req) == nil {
		t.Fatal("coverage exceeded the charge")
	}
	req.LineItems[0].NHIACoveredAmount = decimal.NewFromInt(90)
	req.Discount = decimal.NewFromInt(11)
	if validateInvoice(req) == nil {
		t.Fatal("coverage exceeded discounted invoice total")
	}
}

func TestWebhookIsDisabledBeforeParsingAnyPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	NewHandler(nil, nil, nil).RegisterRoutes(router.Group("/api/v1"))
	for _, body := range []string{`{"event":"charge.success"}`, `{"event":"ignored"}`, `not-json`} {
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodPost, "/api/v1/billing/webhooks/payments", strings.NewReader(body))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusServiceUnavailable {
			t.Fatalf("disabled webhook returned %d: %s", recorder.Code, recorder.Body.String())
		}
	}
}
