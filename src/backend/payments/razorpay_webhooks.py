"""
Razorpay Webhook Handler — verifies signatures and processes subscription events.
Completely isolated from Stripe webhook logic.
"""

import hmac
import hashlib
import json
import time
from bson import ObjectId

from config import (
    RAZORPAY_WEBHOOK_SECRET,
    organizations_collection,
    subscriptions_col,
    pricing_col,
    invoices_col,
)
from payments.razorpay_utils import compute_next_period_end


# ---------------------------------------------------------------------------
# Signature verification
# ---------------------------------------------------------------------------

def verify_razorpay_webhook_signature(payload_bytes: bytes, signature: str) -> bool:
    """
    Verify Razorpay webhook signature using HMAC-SHA256.

    Razorpay signs the raw request body with the webhook secret.
    Header: X-Razorpay-Signature

    Returns True if valid, False otherwise.
    """
    if not RAZORPAY_WEBHOOK_SECRET:
        return False
    expected = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()  # hmac.new is the correct Python stdlib call
    return hmac.compare_digest(expected, signature)


# ---------------------------------------------------------------------------
# Event dispatcher
# ---------------------------------------------------------------------------

def handle_razorpay_webhook_event(event: dict) -> None:
    """
    Dispatch a verified Razorpay webhook event to the appropriate handler.

    Supported events:
        subscription.activated
        subscription.charged
        subscription.completed
        subscription.cancelled
        payment.failed
    """
    event_type = event.get("event", "")
    payload = event.get("payload", {})

    print(f"[RZP WEBHOOK] Processing event: {event_type}")

    handlers = {
        "subscription.activated": _handle_subscription_activated,
        "subscription.charged": _handle_subscription_charged,
        "subscription.completed": _handle_subscription_completed,
        "subscription.cancelled": _handle_subscription_cancelled,
        "payment.failed": _handle_payment_failed,
    }

    handler = handlers.get(event_type)
    if handler:
        try:
            handler(payload)
        except Exception as exc:
            print(f"[RZP WEBHOOK] ERROR in handler for {event_type}: {exc}")
            import traceback
            traceback.print_exc()
    else:
        print(f"[RZP WEBHOOK] Unhandled event type: {event_type}")


# ---------------------------------------------------------------------------
# Individual event handlers
# ---------------------------------------------------------------------------

def _handle_subscription_activated(payload: dict) -> None:
    """
    subscription.activated — subscription is now active after first payment.
    Update DB subscription status to 'active'.
    """
    sub_entity = payload.get("subscription", {}).get("entity", {})
    sub_id = sub_entity.get("id")
    customer_id = sub_entity.get("customer_id")
    plan_id = sub_entity.get("plan_id")
    current_start = sub_entity.get("current_start")
    current_end = sub_entity.get("current_end")
    charge_at = sub_entity.get("charge_at")

    if not sub_id:
        print("[RZP WEBHOOK] subscription.activated: missing subscription id")
        return

    # Resolve tier from plan_id
    plan_doc = pricing_col.find_one({"razorpay_plan_id": plan_id})
    tier = plan_doc.get("name", "").lower() if plan_doc else None

    subscriptions_col.update_one(
        {"razorpaySubscriptionId": sub_id},
        {
            "$set": {
                "razorpaySubscriptionId": sub_id,
                "razorpayCustomerId": customer_id,
                "razorpayPlanId": plan_id,
                "status": "active",
                "tier": tier,
                "currentPeriodStart": current_start,
                "currentPeriodEnd": current_end,
                "accessUntil": current_end,
                "willRenew": True,
                "cancelAtPeriodEnd": False,
                "provider": "razorpay",
            },
            "$setOnInsert": {
                "createdAt": int(time.time()),
                "endedAt": None,
                "trialEnd": None,
            },
        },
        upsert=True,
    )
    print(f"[RZP WEBHOOK] subscription.activated → sub {sub_id}, tier={tier}")


def _handle_subscription_charged(payload: dict) -> None:
    """
    subscription.charged — a recurring payment was successfully collected.
    Update billing period and store invoice record.
    """
    sub_entity = payload.get("subscription", {}).get("entity", {})
    payment_entity = payload.get("payment", {}).get("entity", {})

    sub_id = sub_entity.get("id")
    customer_id = sub_entity.get("customer_id")
    current_start = sub_entity.get("current_start")
    current_end = sub_entity.get("current_end")
    plan_id = sub_entity.get("plan_id")

    payment_id = payment_entity.get("id")
    amount = payment_entity.get("amount", 0)
    currency = payment_entity.get("currency", "INR")

    if not sub_id:
        print("[RZP WEBHOOK] subscription.charged: missing subscription id")
        return

    plan_doc = pricing_col.find_one({"razorpay_plan_id": plan_id})
    tier = plan_doc.get("name", "").lower() if plan_doc else None

    subscriptions_col.update_one(
        {"razorpaySubscriptionId": sub_id},
        {
            "$set": {
                "status": "active",
                "tier": tier,
                "currentPeriodStart": current_start,
                "currentPeriodEnd": current_end,
                "accessUntil": current_end,
                "willRenew": True,
                "cancelAtPeriodEnd": False,
                "latestPaymentId": payment_id,
                "provider": "razorpay",
            }
        },
    )

    # Find org for invoice linkage
    sub_doc = subscriptions_col.find_one({"razorpaySubscriptionId": sub_id})
    org_id = sub_doc.get("organizationId") if sub_doc else None

    if org_id:
        invoices_col.insert_one({
            "organizationId": org_id,
            "razorpaySubscriptionId": sub_id,
            "invoiceId": payment_id,
            "razorpayPaymentId": payment_id,
            "number": None,
            "hostedInvoiceUrl": None,
            "invoicePdf": None,
            "amount": amount,
            "currency": currency,
            "status": "paid",
            "created": int(time.time()),
            "periodStart": current_start,
            "periodEnd": current_end,
            "billingReason": "subscription_cycle",
            "provider": "razorpay",
        })

    print(f"[RZP WEBHOOK] subscription.charged → sub {sub_id}, payment {payment_id}")


def _handle_subscription_completed(payload: dict) -> None:
    """
    subscription.completed — all billing cycles exhausted.
    Mark subscription as completed.
    """
    sub_entity = payload.get("subscription", {}).get("entity", {})
    sub_id = sub_entity.get("id")

    if not sub_id:
        return

    subscriptions_col.update_one(
        {"razorpaySubscriptionId": sub_id},
        {"$set": {"status": "completed", "willRenew": False, "cancelAtPeriodEnd": False}},
    )
    print(f"[RZP WEBHOOK] subscription.completed → sub {sub_id}")


def _handle_subscription_cancelled(payload: dict) -> None:
    """
    subscription.cancelled — subscription was cancelled (immediately or at period end).
    Update status; retain accessUntil so user keeps access till period end.
    """
    sub_entity = payload.get("subscription", {}).get("entity", {})
    sub_id = sub_entity.get("id")
    ended_at = sub_entity.get("ended_at") or int(time.time())
    current_end = sub_entity.get("current_end")

    if not sub_id:
        return

    subscriptions_col.update_one(
        {"razorpaySubscriptionId": sub_id},
        {
            "$set": {
                "status": "cancelled",
                "willRenew": False,
                "cancelAtPeriodEnd": False,
                "endedAt": ended_at,
                # Keep accessUntil = current_end so user retains access till cycle end
                "accessUntil": current_end,
            }
        },
    )
    print(f"[RZP WEBHOOK] subscription.cancelled → sub {sub_id}")


def _handle_payment_failed(payload: dict) -> None:
    """
    payment.failed — a payment attempt failed.
    Mark subscription as past_due; do NOT revoke access immediately.
    """
    payment_entity = payload.get("payment", {}).get("entity", {})
    payment_id = payment_entity.get("id")
    sub_id = (
        payment_entity.get("subscription_id")
        or payment_entity.get("invoice", {}).get("subscription_id")
    )
    error_desc = payment_entity.get("error_description", "Unknown error")

    if sub_id:
        subscriptions_col.update_one(
            {"razorpaySubscriptionId": sub_id},
            {
                "$set": {
                    "status": "past_due",
                    "lastPaymentFailureReason": error_desc,
                    "lastFailedPaymentId": payment_id,
                }
            },
        )
        print(f"[RZP WEBHOOK] payment.failed → sub {sub_id}, payment {payment_id}: {error_desc}")
    else:
        print(f"[RZP WEBHOOK] payment.failed → payment {payment_id} (no sub id): {error_desc}")
