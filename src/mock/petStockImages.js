/**
 * Curated Unsplash pet-only photos — one primary (+ optional fallback) per catalog id.
 * Each photo id is unique across the whole browse list (no repeated images).
 * https://unsplash.com/license — hotlinking with their image URLs is allowed.
 */

const q = '?auto=format&fit=crop&w=800&q=80';
const u = (photoId) => `https://images.unsplash.com/photo-${photoId}${q}`;

/**
 * Primary image matched to the mock pet’s species/breed intent.
 * Fallbacks are different photo ids (same species where possible) for img onError.
 */
export const PET_CATALOG_MEDIA = {
  p1: { primary: u('1552053831-71594a27632d'), fallback: u('1548199973-03cce0c87a77') }, // Golden Retriever
  p2: { primary: u('1592194999418-475e03fbaa1'), fallback: u('1518791841217-8f9f5403842e') }, // British Shorthair
  p3: { primary: u('1561037404-61cd46aa615c'), fallback: u('1587300003388-59208cc962cb') }, // Labrador mix
  p4: { primary: u('1495366691023-cc1a575a0938'), fallback: u('1514888286974-6c03e2ca1dba') }, // Tabby DSH
  p5: { primary: u('1560743173-567706786033'), fallback: u('1583511655857-d19b40a7a54e') }, // German Shepherd
  p6: { primary: u('1585110396000-c9ffd4e4b308'), fallback: u('1516467508483-72140f17d26a') }, // Holland Lop
  p7: { primary: u('1530281700549-e82e7bf50d29'), fallback: u('1561037404-61cd46aa615c') }, // Retriever mix
  p8: { primary: u('1505628346881-b72b27e84530'), fallback: u('1543466835-887f1bf0021e') }, // Beagle
  p9: { primary: u('1513360371669-4adf3dd7dff8'), fallback: u('1574158622682-e40e69881006') }, // Siamese
  p10: { primary: u('1452570053594-1b985b6d9486'), fallback: u('1474487548417-781cb714cb1b') }, // Parakeet
  p11: { primary: u('1605568427561-789e988da616'), fallback: u('1537151608828-ea2b11777ee8') }, // Husky
  p12: { primary: u('1517423443538-83b16f84a090'), fallback: u('1543856123-771a60476da6') }, // Pug
  p13: { primary: u('1548199973-03cce0c87a77'), fallback: u('1530281700549-e82e7bf50d29') }, // Labrador
  p14: { primary: u('1529772316085-9eb38b8a48d8'), fallback: u('1592194999418-475e03fbaa1') }, // Persian
  p15: { primary: u('1574158622682-e40e69881006'), fallback: u('1519052537072-e1b7b1f9c960') }, // Maine Coon
  p16: { primary: u('1595433707802-6b2626ef1c91'), fallback: u('1573865526739-10659fec78a5') }, // Bengal
  p17: { primary: u('1622284337917-4a550210cdc6'), fallback: u('1585110396000-c9ffd4e4b308') }, // Mini Rex
  p18: { primary: u('1552728089-57bdde30beb3'), fallback: u('1452570053594-1b985b6d9486') }, // Cockatiel
  p19: { primary: u('1425082661705-9914e5bb0eb8'), fallback: u('1601758227041-f3ab671e4bee') }, // Syrian hamster
  p20: { primary: u('1587300003388-59208cc962cb'), fallback: u('1560743173-567706786033') }, // Boxer mix
  p21: { primary: u('1573865526739-10659fec78a5'), fallback: u('1529772316085-9eb38b8a48d8') }, // Ragdoll
  p22: { primary: u('1551717743-499fe00edfff'), fallback: u('1583511655857-d19b40a7a54e') }, // Border Collie
  p23: { primary: u('1552726248-0f63edad4e1b'), fallback: u('1474487548417-781cb714cb1b') }, // Dove
  p24: { primary: u('1514888286974-6c03e2ca1dba'), fallback: u('1495366691023-cc1a575a0938') }, // Domestic Shorthair
  p25: { primary: u('1583511655857-d19b40a7a54e'), fallback: u('1551717743-499fe00edfff') }, // Australian Shepherd
  p26: { primary: u('1615796153287-98eacf0bb3b3'), fallback: u('1622284337917-4a550210cdc6') }, // Lionhead
  p27: { primary: u('1615238354814-872d0d3d4e0e'), fallback: u('1543856123-771a60476da6') }, // Corgi mix
  p28: { primary: u('1596854407944-bf87f9fdd49e'), fallback: u('1592194999418-475e03fbaa1') }, // Scottish Fold
  p29: { primary: u('1543856123-771a60476da6'), fallback: u('1517423443538-83b16f84a090') }, // Dachshund
  p30: { primary: u('1543466835-887f1bf0021e'), fallback: u('1505628346881-b72b27e84530') }, // Shih Tzu
  p31: { primary: u('1518791841217-8f9f5403842e'), fallback: u('1596854407944-bf87f9fdd49e') }, // Russian Blue
  p32: { primary: u('1519052537072-e1b7b1f9c960'), fallback: u('1595433707802-6b2626ef1c91') }, // Abyssinian
  p33: { primary: u('1516467508483-72140f17d26a'), fallback: u('1615796153287-98eacf0bb3b3') }, // Netherland Dwarf
  p34: { primary: u('1474487548417-781cb714cb1b'), fallback: u('1552728089-57bdde30beb3') }, // Cockatoo
  p35: { primary: u('1601758227041-f3ab671e4bee'), fallback: u('1425082661705-9914e5bb0eb8') }, // Syrian hamster 2
  p36: { primary: u('1632239926320-4744e0a15d8c'), fallback: u('1587300003388-59208cc962cb') }, // Chow Chow
  p37: { primary: u('1546527868-ccb7ee7dfa6a'), fallback: u('1543466835-887f1bf0021e') }, // Maltese
  p38: { primary: u('1507146420157-bc710227d874'), fallback: u('1513360371669-4adf3dd7dff8') }, // Turkish Angora
  p39: { primary: u('1588943211126-74fa2277ce53'), fallback: u('1516467508483-72140f17d26a') }, // Holland Lop 2
  p40: { primary: u('1548767794-d6c876564a34'), fallback: u('1601758227041-f3ab671e4bee') }, // Guinea pig (small pet)
};

/** All primary URLs — build-time uniqueness check */
export function allPrimaryUrls() {
  return Object.values(PET_CATALOG_MEDIA).map((m) => m.primary);
}

export function assertCatalogUniqueness() {
  const seen = new Set();
  for (const [id, { primary, fallback }] of Object.entries(PET_CATALOG_MEDIA)) {
    const k1 = primary.split('photo-')[1]?.split('?')[0];
    const k2 = fallback.split('photo-')[1]?.split('?')[0];
    if (!k1 || !k2) throw new Error(`[petStockImages] Bad URL for ${id}`);
    if (k1 === k2) throw new Error(`[petStockImages] Primary equals fallback for ${id}`);
    if (seen.has(k1)) throw new Error(`[petStockImages] Duplicate primary photo id: ${k1}`);
    seen.add(k1);
  }
}

assertCatalogUniqueness();
