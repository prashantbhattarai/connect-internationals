import { StrangerCard } from "../../connect/types";
export const matchingWeights = {
 purposes: { points: 5, cap: 10 }, interests: { points: 3, cap: 9 }, complementary: { points: 5, cap: 10 },
 city: 3, university: 2, major: 2, nationality: 1
};
const shared = (a: string[], b: string[]) => [...new Set(a.filter(v => v && b.includes(v)))].sort();
export function scoreCard(viewer: StrangerCard, candidate: StrangerCard, nationalityPreference = false, weights = matchingWeights) {
 const signals: { points: number; text: string; order: number }[] = [];
 const add = (points: number, text: string) => { if (points > 0) signals.push({ points, text, order: signals.length }); };
 const purposes = shared(viewer.purposes, candidate.purposes).slice(0, Math.floor(weights.purposes.cap / weights.purposes.points));
 const interests = shared(viewer.interests, candidate.interests).slice(0, Math.floor(weights.interests.cap / weights.interests.points));
 add(purposes.length * weights.purposes.points, `Shared purposes: ${purposes.join(", ")}`);
 add(interests.length * weights.interests.points, `Shared interests: ${interests.join(", ")}`);
 const theirs = shared(viewer.lookingFor, candidate.canHelpWith);
 const yours = shared(viewer.canHelpWith, candidate.lookingFor).filter(tag => !theirs.includes(tag));
 let remaining = Math.floor(weights.complementary.cap / weights.complementary.points);
 const theirMatches = theirs.slice(0, remaining); remaining -= theirMatches.length;
 const yourMatches = yours.slice(0, remaining);
 add(theirMatches.length * weights.complementary.points, `They can help with: ${theirMatches.join(", ")}`);
 add(yourMatches.length * weights.complementary.points, `You can help with: ${yourMatches.join(", ")}`);
 for (const key of ["city", "university", "major", "nationality"] as const) {
  if (key === "nationality" && !nationalityPreference) continue;
  if (viewer.demographics[key] && viewer.demographics[key] === candidate.demographics[key]) add(weights[key], `Same disclosed ${key}: ${candidate.demographics[key]}`);
 }
 return { score: signals.reduce((sum, s) => sum + s.points, 0), reasons: signals.sort((a,b) => b.points - a.points || a.order - b.order).slice(0,3).map(s => s.text) };
}
export function rankCards(viewer: StrangerCard, cards: StrangerCard[], nationalityPreference = false) {
 return cards.map(card => ({ card, ...scoreCard(viewer, card, nationalityPreference) })).filter(r => r.score > 0)
  .sort((a,b) => b.score - a.score || (a.card.userId < b.card.userId ? -1 : a.card.userId > b.card.userId ? 1 : 0))
  .slice(0,5).map(({ card, reasons }) => ({ ...card, reasons }));
}
