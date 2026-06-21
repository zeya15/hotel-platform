"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # hotels
    op.create_table(
        "hotels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False),
        sa.Column("moneda_base", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("zona_horaria", sa.String(50), nullable=False, server_default="America/Costa_Rica"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_hotels_slug"),
    )

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("hotel_id", sa.Integer(), sa.ForeignKey("hotels.id", ondelete="SET NULL"), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("apellido", sa.String(200), nullable=True),
        sa.Column("telefono", sa.String(30), nullable=True),
        sa.Column("rol", sa.String(30), nullable=False, server_default="huesped"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_hotel_id", "users", ["hotel_id"])

    # room_types
    op.create_table(
        "room_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("hotel_id", sa.Integer(), sa.ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.String(2000), nullable=True),
        sa.Column("capacidad_max", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("precio_base", sa.Numeric(10, 2), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_room_types_hotel_id", "room_types", ["hotel_id"])

    # rooms
    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_type_id", sa.Integer(), sa.ForeignKey("room_types.id", ondelete="CASCADE"), nullable=False),
        sa.Column("numero", sa.String(20), nullable=False),
        sa.Column("piso", sa.Integer(), nullable=True),
        sa.Column("estado", sa.String(30), nullable=False, server_default="disponible"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rooms_room_type_id", "rooms", ["room_type_id"])

    # rates_and_plans
    op.create_table(
        "rates_and_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("hotel_id", sa.Integer(), sa.ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.String(1000), nullable=True),
        sa.Column("costo_extra_adulto", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("costo_extra_nino", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("incluye_desayuno", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # addons
    op.create_table(
        "addons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("hotel_id", sa.Integer(), sa.ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.String(1000), nullable=True),
        sa.Column("precio", sa.Numeric(10, 2), nullable=False),
        sa.Column("tipo_cobro", sa.String(20), nullable=False, server_default="fijo"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # seasons
    op.create_table(
        "seasons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("hotel_id", sa.Integer(), sa.ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=False),
        sa.Column("multiplicador", sa.Numeric(4, 2), nullable=False, server_default="1.0"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # reservations
    op.create_table(
        "reservations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("hotel_id", sa.Integer(), sa.ForeignKey("hotels.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("cliente_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("check_in", sa.Date(), nullable=False),
        sa.Column("check_out", sa.Date(), nullable=False),
        sa.Column("adultos", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("ninos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estado", sa.String(30), nullable=False, server_default="CREATED"),
        sa.Column("total", sa.Numeric(12, 2), nullable=False),
        sa.Column("moneda", sa.String(3), nullable=False),
        sa.Column("tasa_cambio_aplicada", sa.Numeric(10, 6), nullable=False, server_default="1.0"),
        sa.Column("notas_internas", sa.String(2000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reservations_hotel_id", "reservations", ["hotel_id"])
    op.create_index("ix_reservations_estado", "reservations", ["estado"])
    op.create_index("ix_reservations_dates", "reservations", ["check_in", "check_out"])

    # reservation_items
    op.create_table(
        "reservation_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reservation_id", sa.Integer(), sa.ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("room_id", sa.Integer(), sa.ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("rates_and_plans.id", ondelete="SET NULL"), nullable=True),
        sa.Column("precio_habitacion_snapshot", sa.Numeric(10, 2), nullable=False),
        sa.Column("precio_plan_snapshot", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("multiplicador_temporada_snapshot", sa.Numeric(4, 2), nullable=False, server_default="1.0"),
        sa.Column("addons_snapshot", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reservation_items_reservation_id", "reservation_items", ["reservation_id"])

    # payments
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reservation_id", sa.Integer(), sa.ForeignKey("reservations.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("moneda", sa.String(3), nullable=False),
        sa.Column("tasa_cambio", sa.Numeric(10, 6), nullable=False, server_default="1.0"),
        sa.Column("metodo", sa.String(30), nullable=False),
        sa.Column("estado", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("referencia_externa", sa.String(255), nullable=True),
        sa.Column("comprobante_url", sa.String(500), nullable=True),
        sa.Column("aprobado_por_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("aprobado_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("referencia_externa", name="uq_payment_referencia_externa"),
    )
    op.create_index("ix_payments_reservation_id", "payments", ["reservation_id"])
    op.create_index("ix_payments_referencia_externa", "payments", ["referencia_externa"])


def downgrade() -> None:
    op.drop_table("payments")
    op.drop_table("reservation_items")
    op.drop_table("reservations")
    op.drop_table("seasons")
    op.drop_table("addons")
    op.drop_table("rates_and_plans")
    op.drop_table("rooms")
    op.drop_table("room_types")
    op.drop_table("users")
    op.drop_table("hotels")
