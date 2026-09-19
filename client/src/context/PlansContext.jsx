import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_PLANS,
  PLAN_IDS,
  PLAN_RANKS,
} from '../models';
import {
  subscribePlansFromFirestore,
  seedDefaultPlansIfEmpty,
} from '../services/firebase/planService';

const PlansContext = createContext(null);

export function usePlans() {
  const context = useContext(PlansContext);
  if (!context) {
    // Return fallback helpers if accessed outside provider
    return {
      plans: DEFAULT_PLANS,
      plansList: Object.values(DEFAULT_PLANS),
      getPlan: (id) => DEFAULT_PLANS[id] || DEFAULT_PLANS[PLAN_IDS.STARTER],
      getPlanRank: (id) => PLAN_RANKS[id] ?? 0,
      loading: false,
    };
  }
  return context;
}

export function PlansProvider({ children }) {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to seed if missing on start
    seedDefaultPlansIfEmpty();

    // Subscribe to live updates from Firestore
    const unsubscribe = subscribePlansFromFirestore((updatedPlans) => {
      setPlans(updatedPlans);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getPlan = useMemo(() => {
    return (planId) => {
      if (!planId) return plans[PLAN_IDS.STARTER] || DEFAULT_PLANS[PLAN_IDS.STARTER];
      return plans[planId] || plans[PLAN_IDS.STARTER] || DEFAULT_PLANS[PLAN_IDS.STARTER];
    };
  }, [plans]);

  const getPlanRank = useMemo(() => {
    return (planId) => {
      if (!planId) return 0;
      if (plans[planId]?.rank !== undefined) {
        return Number(plans[planId].rank);
      }
      return PLAN_RANKS[planId] ?? 0;
    };
  }, [plans]);

  const plansList = useMemo(() => {
    const list = Object.values(plans);
    return list.sort((a, b) => {
      const rankA = a.rank !== undefined ? Number(a.rank) : (PLAN_RANKS[a.id] ?? 0);
      const rankB = b.rank !== undefined ? Number(b.rank) : (PLAN_RANKS[b.id] ?? 0);
      return rankA - rankB;
    });
  }, [plans]);

  const value = {
    plans,
    plansList,
    getPlan,
    getPlanRank,
    loading,
    PLAN_IDS,
  };

  return (
    <PlansContext.Provider value={value}>
      {children}
    </PlansContext.Provider>
  );
}
