"""
Razorpay Service — isolated Razorpay client and core operations.
Does NOT import or touch any Stripe code.
"""

import hmac
import hashlib

import razorpay
from config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

# ---------------------------------------------------------------------------
# Razorpay client singleton
# ---------------------------------------------------------------------------
_client = None


def get_razorpay_client() -> razorpay.Client:
    """Return a lazily-initialised Razorpay client."""
    global _client
    if _client is None:
        _client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    return _client


# ---------------------------------------------------------------------------
# Customer helpers
# ---------------------------------------------------------------------------

def create_razorpay_customer(email: str, name: str, contact: str = "") -> dict:
    """
    Create a Razorpay customer.
    Returns the full customer object from Razorpay.
    """
    client = get_razorpay_client()
    customer = client.customer.create({
        "name": name,
        "email": email,
        "contact": contact,
        "fail_existing": "0",  # do not fail if customer already exists
    })
    return customer


def fetch_razorpay_customer(customer_id: str) -> dict:
    """Fetch an existing Razorpay customer by ID."""
    client = get_razorpay_client()
    return client.customer.fetch(customer_id)


# ---------------------------------------------------------------------------
# Plan helpers (read-only — plans are created in Razorpay dashboard)
# ---------------------------------------------------------------------------

def fetch_razorpay_plan(plan_id: str) -> dict:
    """Fetch a Razorpay plan by its plan_id."""
    client = get_razorpay_client()
    return client.plan.fetch(plan_id)


# ---------------------------------------------------------------------------
# Subscription helpers
# ---------------------------------------------------------------------------

def create_razorpay_subscription(
    plan_id: str,
    customer_id: str,
    total_count: int = None,
    quantity: int = 1,
    notes: dict = None,
) -> dict:
    """
    Create a Razorpay subscription for a customer.

    Args:
        plan_id:      Razorpay Plan ID (e.g. 'plan_XXXX')
        customer_id:  Razorpay Customer ID
        total_count:  Total billing cycles (auto-calculated based on plan period if None)
        quantity:     Quantity (default 1)
        notes:        Optional metadata dict

    Returns:
        Razorpay subscription object
    """
    client = get_razorpay_client()
    
    # Fetch plan to determine period and set appropriate total_count
    plan = fetch_razorpay_plan(plan_id)
    period = plan.get("period", "monthly")
    
    # Razorpay limits: max 100 for yearly, higher for monthly
    if total_count is None:
        if period == "yearly":
            total_count = 10  # 10 years (max allowed for yearly is 100, but 10 is reasonable)
        elif period == "quarterly":
            total_count = 40  # 10 years (40 quarters)
        else:  # monthly
            total_count = 120  # 10 years (120 months)
    
    payload = {
        "plan_id": plan_id,
        "customer_id": customer_id,
        "total_count": total_count,
        "quantity": quantity,
    }
    if notes:
        payload["notes"] = notes
    return client.subscription.create(payload)


def fetch_razorpay_subscription(subscription_id: str) -> dict:
    """Fetch a Razorpay subscription by ID."""
    client = get_razorpay_client()
    return client.subscription.fetch(subscription_id)


def cancel_razorpay_subscription(subscription_id: str, cancel_at_cycle_end: bool = True) -> dict:
    """
    Cancel a Razorpay subscription.

    Args:
        subscription_id:    Razorpay subscription ID
        cancel_at_cycle_end: If True, cancel at end of current billing cycle.
                             If False, cancel immediately.

    Returns:
        Updated subscription object
    """
    client = get_razorpay_client()
    return client.subscription.cancel(
        subscription_id,
        {"cancel_at_cycle_end": 1 if cancel_at_cycle_end else 0},
    )


# ---------------------------------------------------------------------------
# Order helpers (used for one-time prorated upgrade charges)
# ---------------------------------------------------------------------------

def create_razorpay_order(amount_units: int, currency: str = "USD", notes: dict = None) -> dict:
    """
    Create a Razorpay Order for a one-time charge.

    Args:
        amount_units: Amount in smallest currency unit (cents for USD, paise for INR).
        currency:     Currency code (default USD).
        notes:        Optional metadata dict.

    Returns:
        Razorpay order object with 'id', 'amount', 'currency'.
    """
    client = get_razorpay_client()
    payload = {
        "amount": amount_units,
        "currency": currency,
        "payment_capture": 1,
    }
    if notes:
        payload["notes"] = notes
    return client.order.create(payload)


def verify_razorpay_order_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verify the HMAC-SHA256 signature for an order-based payment.
    Razorpay signs: order_id + "|" + payment_id
    """
    try:
        message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, razorpay_signature)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Payment verification
# ---------------------------------------------------------------------------

def verify_razorpay_payment_signature(
    razorpay_payment_id: str,
    razorpay_subscription_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verify the HMAC-SHA256 signature returned by Razorpay checkout for subscriptions.

    For subscriptions, Razorpay signs: payment_id + "|" + subscription_id
    using the key secret. The SDK's verify_payment_signature() only handles
    order-based payments (requires razorpay_order_id), so we compute it manually.

    Returns True if valid, False otherwise.
    """
    try:
        message = f"{razorpay_payment_id}|{razorpay_subscription_id}".encode("utf-8")
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, razorpay_signature)
    except Exception:
        return False
