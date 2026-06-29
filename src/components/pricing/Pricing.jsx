import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Pricing.module.css";
import Section from "../../ui/Section";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { HiCheckCircle } from "react-icons/hi2";
import { backendURL } from "../../pages/Home";

export default function Pricing() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${backendURL}/pricing-api/pricing`)
            .then(res => res.json())
            .then(data => {
                setPlans(data);
                setLoading(false);
            })
            .catch(err => console.error("Error fetching pricing:", err));
    }, []);

    const handleSelection = (plan) => {
        const token = localStorage.getItem("interview_ai_token");
        if (!token) {
            navigate("/signup");
        } else {
            // Passing plan to login/signup for redirect logic
            navigate("/login", { state: { plan } });
        }
    };

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className="spinner"></div>
            <p className="mt-3 text-muted">Curating the best plans for you...</p>
        </div>
    );

    return (
        <Section title="Simple, Transparent Pricing" className={styles.pricingSection}>
            <div className="container">
                <div className={styles.pricingGrid}>
                    {plans.map((plan) => (
                        <div key={plan._id}>
                            <Card className={`${styles.pricingCard} ${plan.isPopular ? styles.popularCard : ''}`}>
                                {plan.isPopular && (
                                    <span className={styles.popularBadge}>Most Popular</span>
                                )}
                                
                                <div className={styles.planHeader}>
                                    <h3 className={styles.planName}>{plan.name}</h3>
                                    <div className={styles.planPrice}>
                                        <span className={styles.currency}>$</span>
                                        <span className={styles.amount}>{plan.price}</span>
                                        <span className={styles.period}>/mo</span>
                                    </div>
                                    <p className={styles.planDesc}>{plan.description}</p>
                                </div>

                                <ul className={styles.planFeatures}>
                                    {plan.features.map((feat, idx) => (
                                        <li key={idx}>
                                            <HiCheckCircle className={styles.featIcon} />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant={plan.variant || (plan.isPopular ? "primary" : "secondary")}
                                    className="w-100 py-3"
                                    onClick={() => handleSelection(plan)}
                                >
                                    Get Started
                                </Button>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}