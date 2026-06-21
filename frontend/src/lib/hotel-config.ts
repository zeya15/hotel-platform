/**
 * Configuración central del hotel.
 * Para clonar este proyecto a un nuevo cliente, edita únicamente este archivo
 * y reemplaza las imágenes en /public/images/.
 */
export const HOTEL = {
  nombre:   "Hotel Paraíso Verde",
  tagline:  "Tu refugio en el corazón de Costa Rica",
  descripcion:
    "Rodeados de 12 hectáreas de bosque tropical en Turrialba, ofrecemos una experiencia única donde la naturaleza, el confort y la gastronomía costarricense se unen para crear recuerdos inolvidables.",
  ubicacion: "Turrialba, Cartago, Costa Rica",
  telefono:  "+506 2556-1234",
  email:     "reservas@hotelparaisoverde.cr",

  // El número debe estar en formato internacional sin espacios ni guiones
  whatsapp:  "50625561234",
  whatsappMensaje:
    "Hola! Me interesa hacer una reserva en Hotel Paraíso Verde. ¿Podrían ayudarme con información?",

  social: {
    instagram: "https://instagram.com/hotelparaisoverde",
    facebook:  "https://facebook.com/hotelparaisoverde",
    tripadvisor: "#",
  },

  imagenes: {
    hero:       "/images/hero.jpg",
    heroVideo:  "/videos/hero.mp4",
    about:      "/images/about.jpg",
    galeria: [
      "/images/galeria/01.jpg",
      "/images/galeria/02.jpg",
      "/images/galeria/03.jpg",
      "/images/galeria/04.jpg",
      "/images/galeria/05.jpg",
      "/images/galeria/06.jpg",
    ],
  },

  // Planes mostrados en la sección pública.
  // plan_id hace referencia al id en la tabla rates_and_plans de la BD.
  planes: [
    {
      plan_id:     null,
      nombre:      "Solo Hospedaje",
      tagline:     "Descanso puro en la naturaleza",
      precio_extra: 0,
      destacado:   false,
      features: [
        "Habitación premium con vista al bosque",
        "WiFi de alta velocidad en todo el hotel",
        "Acceso a piscina y jardines",
        "Parqueo privado y seguro",
        "Recepción 24 horas",
      ],
    },
    {
      plan_id:     null,
      nombre:      "Desayuno Incluido",
      tagline:     "Empieza el día con sabor tico",
      precio_extra: 18,
      destacado:   true,
      features: [
        "Todo lo del plan Solo Hospedaje",
        "Desayuno típico costarricense",
        "Frutas frescas de la finca",
        "Café y té de producción local",
        "Jugo natural de temporada",
      ],
    },
    {
      plan_id:     null,
      nombre:      "Todo Incluido",
      tagline:     "La experiencia Paraíso Verde completa",
      precio_extra: 55,
      destacado:   false,
      features: [
        "Todo lo del plan Desayuno",
        "Almuerzo y cena en el restaurante",
        "Tour de naturaleza guiado (1 por estadía)",
        "Traslado aeropuerto (ida o vuelta)",
        "Bebidas no alcohólicas ilimitadas",
      ],
    },
  ],

  servicios: [
    { icono: "pool",       titulo: "Piscina Infinita",  descripcion: "Vistas panorámicas al valle de Turrialba" },
    { icono: "restaurant", titulo: "Restaurante",        descripcion: "Cocina costarricense con ingredientes de la finca" },
    { icono: "nature",     titulo: "Tours Naturales",    descripcion: "Guías locales por senderos de bosque primario" },
    { icono: "spa",        titulo: "Spa & Bienestar",    descripcion: "Masajes y tratamientos con plantas medicinales" },
    { icono: "transport",  titulo: "Traslados",           descripcion: "Servicio privado desde y hacia el aeropuerto" },
    { icono: "birds",      titulo: "Avistamiento",        descripcion: "Más de 200 especies de aves en la propiedad" },
  ],
};
