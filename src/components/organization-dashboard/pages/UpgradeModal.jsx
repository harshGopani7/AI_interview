import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineLockClosed,
  HiOutlineXMark,
  HiOutlineRocketLaunch,
  HiCheckCircle,
} from "react-icons/hi2";
import "./UpgradeModal.css";

const PLAN_LIMITS = {
  basic: { max: 5, label: "Basic", price: "$10" },
  gold: { max: 30, label: "Gold", price: "$30" },
  platinum: { max: 100, label: "Platinum", price: "$80" },
};

const PLAN_FEATURES = {
  gold: [
    "30 AI Interviews per month",
    "Advanced Performance Analytics",
    "Custom Question Sets",
    "Priority Email Support",
  ],
  platinum: [
    "100 AI Interviews per month",
    "Full Performance Suite",
    "Custom + AI-Generated Questions",
    "Dedicated Account Manager",
    "API Access",
  ],
};

export function getInterviewLimit(tier) {
  const t = (tier || "basic").toLowerCase();
  return PLAN_LIMITS[t]?.max || 5;
}

export function isLimitExceeded(tier, currentCount) {
  return currentCount >= getInterviewLimit(tier);
}

export default function UpgradeModal({ isOpen, onClose, currentTier, currentCount, maxAllowed }) {
  const navigate = useNavigate();
  const [hoveredPlan, setHoveredPlan] = useState(null);

  if (!isOpen) return null;

  const tierLower = (currentTier || "basic").toLowerCase();
  const currentPlan = PLAN_LIMITS[tierLower] || PLAN_LIMITS.basic;

  const upgradePlans = Object.entries(PLAN_LIMITS)
    .filter(([key]) => {
      const order = ["basic", "gold", "platinum"];
      return order.indexOf(key) > order.indexOf(tierLower);
    })
    .map(([key, val]) => ({
      tier: key,
      ...val,
      features: PLAN_FEATURES[key] || [],
    }));

  const handleUpgrade = (tier) => {
    onClose();
    navigate("/organization/dashboard/upgrade-subscription", {
      state: { tier },
    });
  };

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="upgrade-modal-close" onClick={onClose}>
          <HiOutlineXMark />
        </button>

        <div className="upgrade-modal-header">
          <div className="upgrade-modal-icon-wrapper">
            <HiOutlineLockClosed className="upgrade-modal-lock-icon" />
          </div>
          <h2 className="upgrade-modal-title">Interview Limit Reached</h2>
          <p className="upgrade-modal-subtitle">
            You've used <strong>{currentCount}</strong> of <strong>{maxAllowed}</strong> interviews
            on your <strong>{currentPlan.label}</strong> plan this month.
          </p>
        </div>

        <div className="upgrade-modal-usage-bar-wrapper">
          <div className="upgrade-modal-usage-bar">
            <div
              className="upgrade-modal-usage-fill"
              style={{ width: `${Math.min((currentCount / maxAllowed) * 100, 100)}%` }}
            />
          </div>
          <div className="upgrade-modal-usage-labels">
            <span>{currentCount} used</span>
            <span>{maxAllowed} max</span>
          </div>
        </div>

        <div className="upgrade-modal-divider" />

        <h3 className="upgrade-modal-plans-title">
          <HiOutlineRocketLaunch className="me-2" />
          Upgrade to unlock more interviews
        </h3>

        {upgradePlans.length > 0 ? (
          <div className="upgrade-modal-plans">
            {upgradePlans.map((plan) => (
              <div
                key={plan.tier}
                className={`upgrade-modal-plan-card ${hoveredPlan === plan.tier ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredPlan(plan.tier)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.tier === "gold" && (
                  <span className="upgrade-modal-popular-badge">Most Popular</span>
                )}
                <h4 className="upgrade-modal-plan-name">{plan.label}</h4>
                <div className="upgrade-modal-plan-price">
                  <span className="upgrade-modal-price-amount">{plan.price}</span>
                  <span className="upgrade-modal-price-period">/month</span>
                </div>
                <p className="upgrade-modal-plan-interviews">
                  Up to <strong>{plan.max}</strong> interviews/month
                </p>
                <ul className="upgrade-modal-plan-features">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>
                      <HiCheckCircle className="upgrade-modal-feat-icon" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  className="upgrade-modal-plan-btn"
                  onClick={() => handleUpgrade(plan.tier)}
                >
                  <HiOutlineArrowPath className="me-1" />
                  Upgrade to {plan.label}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="upgrade-modal-max-tier">
            <HiOutlineSparkles className="upgrade-modal-max-icon" />
            <p>You're on the highest plan. Contact support for custom enterprise options.</p>
          </div>
        )}

        <button className="upgrade-modal-dismiss" onClick={onClose}>
          Maybe Later
        </button>
      </div>
    </div>
  );
}
