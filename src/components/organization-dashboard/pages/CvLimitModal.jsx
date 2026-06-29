import { useState, useEffect } from "react";
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
import { getPlans } from "../../../services/subscriptionApi";

export default function CvLimitModal({ isOpen, onClose, currentTier, cvUsed, cvLimit }) {
  const navigate = useNavigate();
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (isOpen) {
      getPlans().then((data) => {
        setPlans(data.plans || data || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tierLower = (currentTier || "basic").toLowerCase();
  const tierOrder = ["basic", "gold", "platinum"];

  const upgradePlans = plans
    .filter((p) => {
      const idx = tierOrder.indexOf(p.tier);
      return idx > tierOrder.indexOf(tierLower) && (p.cv_limit || 0) > 0;
    })
    .map((p) => ({
      tier: p.tier,
      label: p.name,
      price: `$${p.price}`,
      max: p.cv_limit,
      features: p.features || [],
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
          <h2 className="upgrade-modal-title">CV Analysis Limit Reached</h2>
          <p className="upgrade-modal-subtitle">
            You've analyzed <strong>{cvUsed}</strong> of <strong>{cvLimit}</strong> CVs
            on your <strong>{tierLower.charAt(0).toUpperCase() + tierLower.slice(1)}</strong> plan this billing period.
          </p>
        </div>

        <div className="upgrade-modal-usage-bar-wrapper">
          <div className="upgrade-modal-usage-bar">
            <div
              className="upgrade-modal-usage-fill"
              style={{ width: `${Math.min((cvUsed / cvLimit) * 100, 100)}%` }}
            />
          </div>
          <div className="upgrade-modal-usage-labels">
            <span>{cvUsed} used</span>
            <span>{cvLimit} max</span>
          </div>
        </div>

        <div className="upgrade-modal-divider" />

        <h3 className="upgrade-modal-plans-title">
          <HiOutlineRocketLaunch className="me-2" />
          Upgrade to analyze more CVs
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
                  Up to <strong>{plan.max}</strong> CV analyses/month
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
