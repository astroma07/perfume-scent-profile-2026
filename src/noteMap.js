export const NOTE_TO_FRAGRANCES = {
  "sandalwood": ["Strength in Santal — Scents of Wood", "Santal Greenery — Dries Van Noten", "34 Boulevard Saint Germain — Diptyque", "Rock the Myrrh — Dries Van Noten", "Cult Gaia Mast", "Camomile Satin — Dries Van Noten", "Bois Farine — L'Artisan Parfumeur", "Myrrh and Tonka — Jo Malone"],
  "myrrh": ["Rock the Myrrh — Dries Van Noten", "Heretic Nosferatu", "Eau Legendaire Reserve En Afrique 1934", "34 Boulevard Saint Germain — Diptyque", "Myrrh and Tonka — Jo Malone", "Ave Maria — House of Bo"],
  "oud": ["House of Bo Infinitoud", "Heretic Nosferatu", "Eau Legendaire Reserve En Afrique 1934", "Plum in Cognac — Scents of Wood", "Velvet Rose and Oud — Jo Malone", "Guilty Story — Mihan Aromatics"],
  "vetiver": ["Ceremonia Perfume de la Tierra", "Yellowstone Tornado Tru Western", "34 Boulevard Saint Germain — Diptyque", "Santal Greenery — Dries Van Noten", "Wild Vetiver — Creed", "Voodoo Chile — Dries Van Noten", "Memo Paris French Leather"],
  "amber": ["Libre Flowers and Flames — YSL", "Libre Berry — YSL", "House of Bo Bonbon", "Plum in Cognac — Scents of Wood", "Corail Oscuro — Diptyque", "By the Fireplace — Maison Martin Margiela", "Scarlet Poppy Intense — Jo Malone", "Insolence — Guerlain"],
  "leather": ["Heretic Nosferatu", "Rock the Myrrh — Dries Van Noten", "Eau Legendaire Reserve En Afrique 1934", "Yellowstone Tornado Tru Western", "Memo Paris French Leather", "House of Bo Espiritu", "Brutus — Orto Parisi"],
  "patchouli": ["Heretic Nosferatu", "Corail Oscuro — Diptyque", "Ceremonia Perfume de la Tierra", "House of Bo Bonbon", "Etat Libre d'Orange Frustration", "Voodoo Chile — Dries Van Noten"],
  "tobacco": ["Plum in Cognac — Scents of Wood", "Rock the Myrrh — Dries Van Noten", "Yellowstone Tornado Tru Western", "Jazz Club — Maison Martin Margiela", "By the Fireplace — Maison Martin Margiela"],
  "labdanum": ["Heretic Nosferatu", "Corail Oscuro — Diptyque", "Eau Legendaire Reserve En Afrique 1934", "Fleur Du Mal — Dries Van Noten"],
  "rose": ["Libre Flowers and Flames — YSL", "Libre Berry — YSL", "Corail Oscuro — Diptyque", "Beach Blossom — Jo Malone", "Velvet Rose and Oud — Jo Malone", "Rosario — House of Bo", "Scarlet Poppy Intense — Jo Malone"],
  "vanilla": ["House of Bo Bonbon", "Libre Berry — YSL", "Plum in Cognac — Scents of Wood", "By the Fireplace — Maison Martin Margiela", "Myrrh and Tonka — Jo Malone"],
  "bergamot": ["34 Boulevard Saint Germain — Diptyque", "Beach Blossom — Jo Malone", "Cult Gaia Mast", "Santal Greenery — Dries Van Noten", "Jazz Club — Maison Martin Margiela", "Orpheon — Diptyque"],
  "cedar": ["Santal Greenery — Dries Van Noten", "Strength in Santal — Scents of Wood", "Yellowstone Tornado Tru Western", "Cult Gaia Mast", "Memo Paris French Leather", "Poets of Berlin — Vilhelm Parfumerie"],
  "musk": ["Libre Flowers and Flames — YSL", "Beach Blossom — Jo Malone", "Cult Gaia Mast", "House of Bo Bonbon", "Naked Dance — Oddity", "Insolence — Guerlain"],
  "incense": ["Heretic Nosferatu", "34 Boulevard Saint Germain — Diptyque", "Eau Legendaire Reserve En Afrique 1934", "Rock the Myrrh — Dries Van Noten", "Poets of Berlin — Vilhelm Parfumerie", "Ave Maria — House of Bo", "Gong — Floraiku"],
  "earth": ["Ceremonia Perfume de la Tierra", "Heretic Nosferatu", "Yellowstone Tornado Tru Western", "Voodoo Chile — Dries Van Noten", "Phluid Project Intention"],
  "fig": ["Corail Oscuro — Diptyque", "Beach Blossom — Jo Malone", "Philosykos — Diptyque"],
  "tonka": ["House of Bo Bonbon", "Plum in Cognac — Scents of Wood", "Libre Berry — YSL", "Myrrh and Tonka — Jo Malone", "Jazz Club — Maison Martin Margiela"],
  "saffron": ["Eau Legendaire Reserve En Afrique 1934", "House of Bo Infinitoud", "Guilty Story — Mihan Aromatics"],
  "moss": ["Ceremonia Perfume de la Tierra", "Santal Greenery — Dries Van Noten", "Yellowstone Tornado Tru Western", "Crazy Basil — Dries Van Noten"],
  "smoke": ["By the Fireplace — Maison Martin Margiela", "Heretic Nosferatu", "Unknown Pleasures — Kerosene", "Brutus — Orto Parisi"],
  "basil": ["Crazy Basil — Dries Van Noten", "Eau de Sens — Diptyque"],
  "iris": ["Insolence — Guerlain", "Fleur Du Mal — Dries Van Noten", "Naked Dance — Oddity"],
  "orange": ["Taormina Orange — Tom Ford", "Eau de Sens — Diptyque", "Corail Oscuro — Diptyque"],
  "gardenia": ["Gardenia Petale — Van Cleef and Arpels", "Fleur Du Mal — Dries Van Noten"],
  "birch": ["Poets of Berlin — Vilhelm Parfumerie", "Unknown Pleasures — Kerosene"],
  "suede": ["House of Bo Espiritu", "Camomile Satin — Dries Van Noten", "Calahorra — Woha Parfums"],
  "jasmine": ["Libre Flowers and Flames — YSL", "Scarlet Poppy Intense — Jo Malone", "Casa Blanca — House of Bo"],
  "wood": ["Bois Farine — L'Artisan Parfumeur", "Eau Capitale — Diptyque", "Orpheon — Diptyque"],
};

export function getFragrancesForNote(noteName) {
  const lower = noteName.toLowerCase();
  const exact = NOTE_TO_FRAGRANCES[lower];
  if (exact) return exact;
  const partial = Object.entries(NOTE_TO_FRAGRANCES).find(([k]) => lower.includes(k) || k.includes(lower));
  if (partial) return partial[1];
  return null;
}
