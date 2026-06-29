"""
Razorpay Utilities — custom proration calculator and helper functions.
All proration logic is computed server-side; we do NOT rely on Razorpay for this.
"""

import time
import math


# ---------------------------------------------------------------------------
# Proration calculator
# ---------------------------------------------------------------------------

def calculate_proration(
    current_plan_price: float,
    new_plan_price: float,
    current_period_start: int,
    current_period_end: int,
) -> dict:
    """
    Calculate the prorated charge when a user upgrades mid-cycle.

    Logic:
        1. Determine total days in the current billing cycle.
        2. Determine days remaining from now until period end.
        3. Compute unused credit = (remaining_days / total_days) * current_plan_price
        4. Prorated charge = new_plan_price - unused_credit
           (floored to 0 — never charge negative)

    Args:
        current_plan_price:   Monthly price of the current plan (USD).
        new_plan_price:       Monthly price of the new plan (USD).
        current_period_start: Unix timestamp of current billing period start.
        current_period_end:   Unix timestamp of current billing period end.

    Returns:
        dict with keys:
            total_days          — total days in billing cycle
            remaining_days      — days left in cycle from now
            unused_credit       — credit for unused portion of current plan
            prorated_charge     — amount to charge for the upgrade (USD, ≥ 0)
            prorated_charge_paise — same amount in paise (INR × 100) for Razorpay
    """
    now = int(time.time())

    total_seconds = current_period_end - current_period_start
    remaining_seconds = max(current_period_end - now, 0)

    total_days = total_seconds / 86400
    remaining_days = remaining_seconds / 86400

    if total_days <= 0:
        # Edge case: period already ended
        unused_credit = 0.0
    else:
        unused_credit = (remaining_days / total_days) * current_plan_price

    prorated_charge = max(new_plan_price - unused_credit, 0.0)

    # Round to 2 decimal places for display; convert to cents for Razorpay (USD × 100)
    prorated_charge = round(prorated_charge, 2)
    unused_credit = round(unused_credit, 2)

    # Razorpay amounts are in smallest currency unit (cents for USD)
    prorated_charge_cents = int(math.ceil(prorated_charge * 100))

    return {
        "total_days": round(total_days, 2),
        "remaining_days": round(remaining_days, 2),
        "unused_credit": unused_credit,
        "prorated_charge": prorated_charge,
        "prorated_charge_cents": prorated_charge_cents,
    }


# ---------------------------------------------------------------------------
# Period helpers
# ---------------------------------------------------------------------------

def compute_next_period_end(period_start: int, months: int = 1) -> int:
    """
    Compute the end of a billing period given a start timestamp.
    Uses a simple 30-day month approximation.

    Args:
        period_start: Unix timestamp of period start.
        months:       Number of months to add (default 1).

    Returns:
        Unix timestamp of period end.
    """
    return period_start + (months * 30 * 24 * 3600)


def is_subscription_active(status: str, current_period_end: int) -> bool:
    """
    Determine if a Razorpay subscription should be considered active.

    A subscription is active if:
        - Its status is 'active' or 'authenticated', OR
        - Its status is 'cancelled' but the period hasn't ended yet
          (user retains access until period end).

    Args:
        status:             Razorpay subscription status string.
        current_period_end: Unix timestamp of current period end.

    Returns:
        True if the user should have active access.
    """
    if status in ("active", "authenticated", "created"):
        return True
    if status == "cancelled" and current_period_end:
        return int(time.time()) < current_period_end
    return False


# ---------------------------------------------------------------------------
# Tier hierarchy helpers
# ---------------------------------------------------------------------------

TIER_HIERARCHY = ["basic", "gold", "platinum"]


def is_upgrade(current_tier: str, new_tier: str) -> bool:
    """Return True if new_tier is higher than current_tier."""
    try:
        return TIER_HIERARCHY.index(new_tier.lower()) > TIER_HIERARCHY.index(current_tier.lower())
    except ValueError:
        return False


def is_downgrade(current_tier: str, new_tier: str) -> bool:
    """Return True if new_tier is lower than current_tier."""
    try:
        return TIER_HIERARCHY.index(new_tier.lower()) < TIER_HIERARCHY.index(current_tier.lower())
    except ValueError:
        return False
