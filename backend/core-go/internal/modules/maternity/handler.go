package maternity

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"hospital-hims/backend/core-go/internal/auditlog"
	"hospital-hims/backend/core-go/internal/auth"
	"hospital-hims/backend/core-go/internal/common/clinicalrecords"
)

type Handler struct{ records *clinicalrecords.Handler }

func NewHandler(db *sql.DB, writer *auditlog.Writer, tokens *auth.TokenService) *Handler {
	return &Handler{clinicalrecords.NewHandler(db, writer, tokens, "maternity")}
}
func (h *Handler) RegisterRoutes(api *gin.RouterGroup) { h.records.RegisterRoutes(api) }
