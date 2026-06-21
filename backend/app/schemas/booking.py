from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator


class AddonSelection(BaseModel):
    addon_id: int
    cantidad: int = 1


class BookingCreateRequest(BaseModel):
    hotel_id: int
    room_id: int
    plan_id: int | None = None
    check_in: date
    check_out: date
    adultos: int = 1
    ninos: int = 0
    addons: list[AddonSelection] = []
    moneda_pago: str = "USD"

    @field_validator("check_out")
    @classmethod
    def checkout_after_checkin(cls, v, info):
        if "check_in" in info.data and v <= info.data["check_in"]:
            raise ValueError("check_out must be after check_in")
        return v


class BookingItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    plan_id: int | None
    precio_habitacion_snapshot: float
    precio_plan_snapshot: float
    multiplicador_temporada_snapshot: float
    addons_snapshot: list
    subtotal: float


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hotel_id: int
    cliente_id: int
    check_in: date
    check_out: date
    adultos: int
    ninos: int
    estado: str
    total: float
    moneda: str
    tasa_cambio_aplicada: float
    items: list[BookingItemOut]


class GuestBookingRequest(BaseModel):
    hotel_id: int
    room_type_id: int
    plan_id: int | None = None
    check_in: date
    check_out: date
    adultos: int = 1
    ninos: int = 0
    nombre: str
    email: str
    telefono: str | None = None
    notas: str | None = None
    moneda_pago: str = "USD"

    @field_validator("check_out")
    @classmethod
    def checkout_after_checkin(cls, v, info):
        if "check_in" in info.data and v <= info.data["check_in"]:
            raise ValueError("check_out must be after check_in")
        return v


class BookingPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    check_in: date
    check_out: date
    adultos: int
    ninos: int
    estado: str
    total: float
    moneda: str


class BookingStatusUpdate(BaseModel):
    estado: str
    notas_internas: str | None = None


class OccupancyResponse(BaseModel):
    hotel_id: int
    fecha_inicio: date
    fecha_fin: date
    # {room_id: {date_str: estado}}
    grid: dict[int, dict[str, str]]
