package billing

import (
	"context"
	"net/http"
)

// A provider must authenticate the raw request and normalize its event before
// any financial mutation. No verifier is configured until a gateway is chosen.
// An unconfigured handler fails closed, including for ignored event types.
type PaymentWebhookVerifier interface {
	Verify(context.Context, *http.Request) (WebhookPayload, error)
}
