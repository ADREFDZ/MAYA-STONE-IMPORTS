export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
  googleMapsEmbedUrl: string;
  googleMapsDirectLink: string;
}

export const BRANCHES: Branch[] = [
  {
    id: "leon-showroom",
    name: "Showroom & Estudio León",
    city: "León, Gto.",
    address:
      "Blvrd Francisco Villa 4602-Bodega A4, Leon I, 37235 León de los Aldama, Gto.",
    phone: "+52 477 854 4033",
    hours: "Lun - Vie: 9:00 - 17:00",
    // Para obtener la URL embed de Google Maps: En Google Maps -> Compartir -> Insertar un mapa -> Copiar solo el atributo src
    googleMapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3721.172991813297!2d-101.63742792495266!3d21.145512780533164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842bbf5613881117%3A0xaa73e505a5db3764!2sMaya%20Stone%20Imports!5e0!3m2!1ses!2smx!4v1785512858074!5m2!1ses!2smx",
    googleMapsDirectLink:
      "https://www.google.com/maps/place/Maya+Stone+Imports/@21.1455128,-101.6374279,17z/data=!3m1!4b1!4m6!3m5!1s0x842bbf5613881117:0xaa73e505a5db3764!8m2!3d21.1455128!4d-101.634853!16s%2Fg%2F11n47g09z0?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "cdmx-showroom",
    name: "Estudio CDMX",
    city: "Ciudad de México",
    address:
      "Pedregal 57Lomas - Virreyes, Lomas de Chapultepec IV Secc, Miguel Hidalgo, 11000 Ciudad de México, CDMX",
    phone: "",
    hours: "Lun - Vie: 9:00 - 17:00",
    googleMapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15050.750191512734!2d-99.2100198489202!3d19.425901573002754!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d201f12ec7216f%3A0x701a6db6dd9766a3!2sPedregal%2057%2C%20Lomas%20-%20Virreyes%2C%20Lomas%20de%20Chapultepec%2C%20Miguel%20Hidalgo%2C%2011000%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1ses!2smx!4v1786981753428!5m2!1ses!2smx",
    googleMapsDirectLink: "https://maps.app.goo.gl/wczxRaYHa5tpywVn7",
  },
  {
    id: " QROO-showroom",
    name: "Estudio  CANCUN QROO",
    city: "CANCUN QROO",
    address:
      "EDIFICIO PORT MARINA 24-1-1, UC24-1 MANZANA 27 LOTE 1-02 SECCION E AVENIDA BONAMPAK, CANCUN QROO C.P. 77500",
    phone: "",
    hours: "Lun - Vie: 9:00 - 17:00",
    googleMapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3720.7637448870137!2d-86.80843972500251!3d21.161798380520985!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f4c2f141139c773%3A0xc9f4721e9cb2c40a!2sPort%20Marina!5e0!3m2!1ses!2smx!4v1786982029323!5m2!1ses!2smx",
    googleMapsDirectLink: "https://maps.app.goo.gl/A3FUhDHrhDCEUjgQA",
  },
];
