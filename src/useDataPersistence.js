import { useEffect, useRef } from "react";
import { syncBottles, syncTestedScents, syncWearLog, syncBottleRatings, syncPairings, syncPreferences } from "./dataSync.js";

/*
 * useDataPersistence — single hook replacing 20+ useEffects.
 * Saves to localStorage (instant cache) and Supabase (cloud sync).
 * Only syncs to Supabase after initial load is complete (dataLoaded=true).
 */
export function useDataPersistence(state, userId, dataLoaded) {
  const {
    notes, bottles, wearLog, wearRatings, bottleRatings, testedScents,
    visibleStats, noteOverrides, opposingPairs, visibleTabs, theme,
    pairingNotes, pairingRatings, rejectedPairings, purchaseData,
    customPairings, vibeMap, likedNotes, dislikedNotes,
  } = state;

  /* Track whether initial render is done to avoid syncing on mount */
  const isInitial = useRef(true);
  useEffect(() => { isInitial.current = false; }, []);

  const save = (key, val) => {
    try { localStorage.setItem(`scent_${key}`, JSON.stringify(val)); } catch {}
  };

  /* ─── Core data → localStorage + Supabase ─── */
  useEffect(() => { save("notes", notes); }, [notes]);

  useEffect(() => {
    save("bottles", bottles);
    if (!isInitial.current && dataLoaded && userId) syncBottles(userId, bottles);
  }, [bottles]);

  useEffect(() => {
    save("wearLog", wearLog);
    if (!isInitial.current && dataLoaded && userId) syncWearLog(userId, wearLog, wearRatings);
  }, [wearLog]);

  useEffect(() => {
    save("wearRatings", wearRatings);
    if (!isInitial.current && dataLoaded && userId) syncWearLog(userId, wearLog, wearRatings);
  }, [wearRatings]);

  useEffect(() => {
    save("bottleRatings", bottleRatings);
    if (!isInitial.current && dataLoaded && userId) syncBottleRatings(userId, bottleRatings);
  }, [bottleRatings]);

  useEffect(() => {
    save("testedScents", testedScents);
    if (!isInitial.current && dataLoaded && userId) syncTestedScents(userId, testedScents);
  }, [testedScents]);

  /* ─── Pairings (4 related states, one sync call) ─── */
  const pairingDeps = JSON.stringify({ customPairings, pairingNotes, pairingRatings, rejectedPairings });
  useEffect(() => {
    save("customPairings", customPairings);
    save("pairingNotes", pairingNotes);
    save("pairingRatings", pairingRatings);
    save("rejectedPairings", rejectedPairings);
    if (!isInitial.current && dataLoaded && userId) syncPairings(userId, { customPairings, pairingNotes, pairingRatings, rejectedPairings });
  }, [pairingDeps]);

  /* ─── Preferences (9 related states, one sync call) ─── */
  const prefsDeps = JSON.stringify({ likedNotes, dislikedNotes, noteOverrides, opposingPairs, vibeMap, purchaseData, visibleStats, visibleTabs, theme });
  useEffect(() => {
    save("visibleStats", visibleStats);
    save("noteOverrides", noteOverrides);
    save("opposingPairs", opposingPairs);
    save("visibleTabs", visibleTabs);
    save("theme", theme);
    save("purchaseData", purchaseData);
    save("vibeMap", vibeMap);
    save("likedNotes", likedNotes);
    save("dislikedNotes", dislikedNotes);
    if (!isInitial.current && dataLoaded && userId) {
      syncPreferences(userId, { likedNotes, dislikedNotes, noteOverrides, opposingPairs, vibeMap, purchaseData, visibleStats, visibleTabs, theme });
    }
  }, [prefsDeps]);
}
