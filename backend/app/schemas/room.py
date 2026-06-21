from pydantic import BaseModel, ConfigDict


class RoomTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hotel_id: int
    nombre: str
    descripcion: str | None
    capacidad_max: int
    precio_base: float
    imagen_url: str | None = None
    amenidades: list[str] | None = None
    activo: bool


class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_type_id: int
    numero: str
    piso: int | None
    estado: str
    activo: bool


class AvailabilityRequest(BaseModel):
    hotel_id: int
    check_in: str   # YYYY-MM-DD
    check_out: str
    adultos: int = 1
    ninos: int = 0


class AvailableRoomTypeOut(BaseModel):
    room_type: RoomTypeOut
    rooms_disponibles: int
    precio_calculado: float
    temporada_activa: str | None
    multiplicador: float
