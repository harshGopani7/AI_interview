import { useNavigate } from "react-router-dom";
import {
  HiOutlineLockClosed,
  HiOutlineRocketLaunch,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { HiCheckCircle } from "react-icons/hi2";
import Button from "../../../ui/Button";
import "./OrgCvAnalyzer.css";
import { getPlans } from "../../../services/subscriptionApi";
import { useEffect, useState } from "react";

const FEATURES = [
  "AI-powered resume screening & scoring",
  "Bulk upload & analyze multiple CVs at once",
  "Detailed skill matching & gap analysis",
  "Candidate ranking with summary & detailed reports",
  "One-click interview scheduling from results",
];

export default function CvUpgradeGate({ planName, subscription }) {
  // console.log(subscription)
  const navigate = useNavigate();
  const [plans, setPlans] = useState([])

  // Fetch the plans present in database
  useEffect(() => {
    getPlans().then((data) => {
      // console.log(data)
      setPlans(data.plans || data || [])
    })
  }, [planName])

  const goldPlan = Array.isArray(plans) ? plans.find(p => p.tier === "gold") : null;
  const platinumPlan = Array.isArray(plans) ? plans.find(p => p.tier === "platinum") : null;
  return (
    <div className="cv-analyzer-container fade-in">
      <div className="cv-upgrade-gate">
        <div className="cv-upgrade-gate-glow" />
        <div className="cv-upgrade-gate-icon">
          <HiOutlineLockClosed />
        </div>
        <h2 className="cv-upgrade-gate-title">CV Analysis is a Premium Feature</h2>
        <p className="cv-upgrade-gate-subtitle">
          You're currently on the <strong>{planName}</strong> plan. Upgrade to{" "}
          <strong>Gold</strong> or higher to unlock AI-powered resume screening
          and candidate ranking.
        </p>

        <div className="cv-upgrade-gate-features">
          {FEATURES.map((feat, idx) => (
            <div key={idx} className="cv-upgrade-gate-feature">
              <HiCheckCircle className="cv-upgrade-gate-feat-icon" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <div className="cv-upgrade-gate-plans">
          <div className="cv-upgrade-gate-plan">
            <div className="cv-upgrade-gate-plan-badge">Recommended</div>
            <h3>Gold</h3>
            <div className="cv-upgrade-gate-plan-price">
              <span>${goldPlan?.price || "—"}</span>/month
            </div>
            <p>{goldPlan?.description || "30 interviews + Full CV Analysis"}</p>
            <Button
              onClick={() =>
                navigate("/organization/dashboard/subscription")
              }
            >
              <HiOutlineRocketLaunch style={{ marginRight: 6 }} />
              Upgrade to Gold
            </Button>
          </div>
          <div className="cv-upgrade-gate-plan">
            <h3>Platinum</h3>
            <div className="cv-upgrade-gate-plan-price">
              <span>${platinumPlan?.price || "—"}</span>/month
            </div>
            <p>{platinumPlan?.description || "100 interviews + Full CV Analysis"}</p>
            <Button
              variant="secondary"
              onClick={() =>
                navigate("/organization/dashboard/subscription")
              }
            >
              <HiOutlineSparkles style={{ marginRight: 6 }} />
              Upgrade to Platinum
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
