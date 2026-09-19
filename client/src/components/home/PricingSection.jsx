import React from 'react';
import CurvyUnderline from './CurvyUnderline';
import LimitedTimeTimer from './LimitedTimeTimer';
import { usePlans } from '../../context/PlansContext';
import { PlanCard } from '../pricing';

export default function PricingSection({ isDark, onOpenAuthModal, headingClass, subClass }) {
  const { plansList } = usePlans();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className={`text-lg sm:text-xl font-bold ${headingClass}`}>
          Choose Your{' '}
          <span className="relative inline-block">
            <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>Plan</span>
            <CurvyUnderline />
          </span>
        </h3>
        <p className={`text-xs sm:text-sm ${subClass}`}>
          Start with a free starter pass. Upgrade or cancel anytime with one click.
        </p>
        <LimitedTimeTimer isDark={isDark} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {plansList.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isDark={isDark}
            onSelect={() => onOpenAuthModal('signup')}
          />
        ))}
      </div>
    </div>
  );
}

