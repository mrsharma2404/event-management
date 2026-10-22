/** Unsplash photo ids used across the catalogue. Verified to resolve. */
export const PHOTOS = {
  brideBouquet: 'photo-1519741497674-611481863552',
  floralTable: 'photo-1511795409834-ef04bbd61622',
  banquet: 'photo-1464366400600-7168b8af9bc3',
  audience: 'photo-1540575467063-178a50c2df87',
  confettiStage: 'photo-1492684223066-81342ee5ff30',
  balloons: 'photo-1530103862676-de8c9debad1d',
  concertConfetti: 'photo-1505236858219-8359eb29e329',
  hillsPortrait: 'photo-1478146896981-b80fe463b330',
  aisle: 'photo-1469371670807-013ccf25f16a',
  ringsFlowers: 'photo-1515934751635-c81c6bc9a2d8',
  weddingKiss: 'photo-1583939003579-730e3918a45a',
  jaisalmer: 'photo-1599661046289-e31897846e41',
  goa: 'photo-1512343879784-a960bf40e7f2',
  jaipur: 'photo-1477587458883-47145ed94245',
  kerala: 'photo-1602216056096-3b40cc0c9944',
  mumbai: 'photo-1570168007204-dfb528c6958f',
  concertPhone: 'photo-1501281668745-f7f57925c3b4',
  rave: 'photo-1514525253161-7a46d19cd819',
  dinnerParty: 'photo-1528605248644-14dd04022da1',
  conference: 'photo-1587825140708-dfaf72ae4b04',
  tableSetting: 'photo-1561912774-79769a0a0a7a',
  coupleHills: 'photo-1532712938310-34cb3982ef74',
  goldRings: 'photo-1606800052052-a08af7148866',
  microphone: 'photo-1475721027785-f74eccf877e2',
  cheers: 'photo-1527529482837-4698179dc6ce',
  neon: 'photo-1566737236500-c8ac43014a67',
  agra: 'photo-1524492412937-b28074a5d7da',
  mumbaiTaj: 'photo-1595658658481-d53d3f999875',
  phuket: 'photo-1609137144813-7d9921338f24',
  himachal: 'photo-1544735716-392fe2489ffa',
  mrMrs: 'photo-1507504031003-b417219a0fde',
  confetti: 'photo-1513151233558-d860c5398176',
} as const;

export function unsplash(id: string, width = 1200) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;
}
