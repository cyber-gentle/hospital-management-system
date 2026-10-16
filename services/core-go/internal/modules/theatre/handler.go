package theatre

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/common/clinicalrecords"
)

type Handler struct{ records *clinicalrecords.Handler }

func NewHandler(db *sql.DB, writer *auditlog.Writer, tokens *auth.TokenService) *Handler {
	return &Handler{clinicalrecords.NewHandler(db, writer, tokens, "theatre")}
}
func (h *Handler) RegisterRoutes(api *gin.RouterGroup) { h.records.RegisterRoutes(api) }
