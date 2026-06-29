"""
Razorpay Routes — all Razorpay-specific API endpoints.
Blueprint prefix: /razorpay
Completely isolated from Stripe routes.
"""

import time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from config import (
    organizations_collection,
    subscriptions_col,
    pricing_col,
    invoices_col,
    RAZORPAY_KEY_ID,
    FRONTEND_URL,
)
from payments.razorpay_service import (
    create_razorpay_customer,
    fetch_razorpay_customer,
    fetch_razorpay_plan,
    create_razorpay_subscription,
    fetch_razorpay_subscription,
    cancel_razorpay_subscription,
    verify_razorpay_payment_signature,
    create_razorpay_order,
    verify_razorpay_order_signature,
)
from payments.razorpay_utils import (
    calculate_proration,
    is_subscription_active,
    is_upgrade,
    is_downgrade,
    TIER_HIERARCHY,
    compute_next_period_end,
)
from payments.razorpay_webhooks import (
    verify_razorpay_webhook_signature,
    handle_razorpay_webhook_event,
)

razorpay_bp = Blueprint("razorpay", __name__)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_rzp_subscription_by_org(org_id: str) -> dict | None:
    """Return the most recent Razorpay subscription for an org."""
    return subscriptions_col.find_one(
        {"organizationId": ObjectId(org_id), "provider": "razorpay"},
        sort=[("createdAt", -1)],
    )


def _get_plan_by_tier(tier: str) -> dict | None:
    """Fetch pricing doc by tier name (case-insensitive)."""
    return pricing_col.find_one({"name": {"$regex": f"^{tier}$", "$options": "i"}})


# ---------------------------------------------------------------------------
# GET /razorpay/key  — return public key to frontend
# ---------------------------------------------------------------------------
@razorpay_bp.route("/key", methods=["GET"])
def get_razorpay_key():
    """Return the Razorpay public key ID (safe to expose to frontend)."""
    return jsonify({"key_id": RAZORPAY_KEY_ID}), 200


# ---------------------------------------------------------------------------
# POST /razorpay/create-subscription
# Body: { "email": "...", "tier": "basic|gold|platinum" }
# Creates/reuses a Razorpay customer and subscription, returns sub details.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/create-subscription", methods=["POST"])
def create_subscription():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    tier = data.get("tier", "").strip().lower()

    if not email or not tier:
        return jsonify({"error": "email and tier are required"}), 400

    # Fetch org
    org = organizations_collection.find_one({"email": email, "role": "organization"})
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    org_id = org["_id"]

    # Prevent duplicate active subscriptions
    existing_sub = _get_rzp_subscription_by_org(str(org_id))
    if existing_sub:
        status = existing_sub.get("status", "")
        period_end = existing_sub.get("currentPeriodEnd", 0)
        if is_subscription_active(status, period_end):
            return jsonify({
                "error": "You already have an active Razorpay subscription. Use the upgrade endpoint to change plans."
            }), 409

    # Fetch plan
    plan = _get_plan_by_tier(tier)
    print("Plan:", plan)
    print('*' * 50)
    if not plan:
        return jsonify({"error": f"Plan '{tier}' not found"}), 404

    rzp_plan_id = plan.get("razorpay_plan_id")
    print("RZP Plan ID:", rzp_plan_id)
    print('*' * 50)
    if not rzp_plan_id:
        return jsonify({"error": f"Plan '{tier}' has no Razorpay plan ID configured. Add razorpay_plan_id to the pricing document."}), 400

    # Fetch the actual plan from Razorpay to get real amount/currency
    try:
        rzp_plan = fetch_razorpay_plan(rzp_plan_id)
        print("RZP Plan:", rzp_plan)
        print('*' * 50)
        plan_amount_paise = rzp_plan.get("item", {}).get("amount", 0)  # in paise
        plan_currency = rzp_plan.get("item", {}).get("unit", rzp_plan.get("item", {}).get("currency", "INR"))
        # item.unit is sometimes used; fall back to checking interval
        plan_currency = rzp_plan.get("item", {}).get("currency", "INR")
        if plan_currency != "INR":
            print(f"[RZP] WARNING: Plan {rzp_plan_id} is in {plan_currency}, not INR. UPI/netbanking will not work. Recreate the plan in INR.")
    except Exception as exc:
        print(f"[RZP] Could not fetch plan details from Razorpay: {exc}")
        plan_amount_paise = int(float(plan.get("price", 0)) * 100)
        plan_currency = "INR"

    # Create or reuse Razorpay customer
    rzp_customer_id = org.get("razorpayCustomerId")
    if not rzp_customer_id:
        try:
            customer = create_razorpay_customer(
                email=email,
                name=org.get("organizationName", ""),
                contact=org.get("phone", ""),
            )
            rzp_customer_id = customer["id"]
            organizations_collection.update_one(
                {"_id": org_id},
                {"$set": {"razorpayCustomerId": rzp_customer_id}},
            )
            print(f"[RZP] Created customer {rzp_customer_id} for org {org_id}")
        except Exception as exc:
            print(f"[RZP] Customer creation failed: {exc}")
            return jsonify({"error": f"Failed to create Razorpay customer: {str(exc)}"}), 500

    # Create subscription
    try:
        subscription = create_razorpay_subscription(
            plan_id=rzp_plan_id,
            customer_id=rzp_customer_id,
            notes={
                "org_id": str(org_id),
                "tier": tier,
                "email": email,
            },
        )
        sub_id = subscription["id"]

        print(f"[RZP] Subscription {sub_id} created on Razorpay for org {org_id}, tier={tier} — awaiting payment")

        return jsonify({
            "subscription_id": sub_id,
            "customer_id": rzp_customer_id,
            "key_id": RAZORPAY_KEY_ID,
            "tier": tier,
            "plan_name": plan.get("name"),
            "amount": plan_amount_paise,
            "currency": plan_currency,
            "org_name": org.get("organizationName", ""),
            "email": email,
            "contact": org.get("phone", ""),
        }), 200

    except Exception as exc:
        print(f"[RZP] Subscription creation failed: {exc}")
        return jsonify({"error": f"Failed to create subscription: {str(exc)}"}), 500


# ---------------------------------------------------------------------------
# POST /razorpay/verify-payment
# Body: { "razorpay_payment_id", "razorpay_subscription_id", "razorpay_signature" }
# Verifies checkout signature and activates subscription in DB.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/verify-payment", methods=["POST"])
def verify_payment():
    data = request.json or {}
    payment_id = data.get("razorpay_payment_id", "")
    sub_id = data.get("razorpay_subscription_id", "")
    signature = data.get("razorpay_signature", "")

    if not payment_id or not sub_id or not signature:
        return jsonify({"error": "payment_id, subscription_id and signature are required"}), 400

    if not verify_razorpay_payment_signature(payment_id, sub_id, signature):
        return jsonify({"error": "Invalid payment signature"}), 400

    # Fetch live subscription from Razorpay to get billing period
    try:
        rzp_sub = fetch_razorpay_subscription(sub_id)
    except Exception as exc:
        print(f"[RZP] Failed to fetch subscription {sub_id}: {exc}")
        return jsonify({"error": "Could not verify subscription with Razorpay"}), 500

    current_start = rzp_sub.get("current_start") or int(time.time())
    current_end = rzp_sub.get("current_end") or compute_next_period_end(current_start)
    status = rzp_sub.get("status", "active")
    plan_id = rzp_sub.get("plan_id")

    plan_doc = pricing_col.find_one({"razorpay_plan_id": plan_id})
    tier = plan_doc.get("name", "").lower() if plan_doc else None

    # Resolve org_id from Razorpay subscription notes (set during create-subscription)
    notes = rzp_sub.get("notes") or {}
    org_id_str = notes.get("org_id") or rzp_sub.get("customer_id")
    org_id_obj = None
    if org_id_str:
        try:
            org_id_obj = ObjectId(org_id_str)
        except Exception:
            pass

    # Upsert the full subscription record — only written here after payment succeeds
    subscriptions_col.update_one(
        {"razorpaySubscriptionId": sub_id},
        {
            "$set": {
                "status": "active",
                "tier": tier,
                "razorpayPlanId": plan_id,
                "currentPeriodStart": current_start,
                "currentPeriodEnd": current_end,
                "accessUntil": current_end,
                "willRenew": True,
                "cancelAtPeriodEnd": False,
                "latestPaymentId": payment_id,
                "provider": "razorpay",
            },
            "$setOnInsert": {
                "organizationId": org_id_obj,
                "razorpaySubscriptionId": sub_id,
                "createdAt": int(time.time()),
                "endedAt": None,
                "trialEnd": None,
            },
        },
        upsert=True,
    )

    # Set org limits, reset usage counters, and mark as paid on first activation
    if org_id_obj and plan_doc:
        cv_limit = plan_doc.get("cv_limit", 0)
        interview_limit = plan_doc.get("interview_limit", 0)
        organizations_collection.update_one(
            {"_id": org_id_obj},
            {"$set": {
                "cvLimit": cv_limit,
                "interviewLimit": interview_limit,
                "cvUsed": 0,
                "interviewUsed": 0,
                "payment_status": "paid",
            }},
        )

    # Record invoice
    sub_doc = subscriptions_col.find_one({"razorpaySubscriptionId": sub_id})
    invoice_org_id = (sub_doc.get("organizationId") if sub_doc else None) or org_id_obj
    if invoice_org_id:
        invoices_col.insert_one({
            "organizationId": invoice_org_id,
            "razorpaySubscriptionId": sub_id,
            "invoiceId": payment_id,
            "razorpayPaymentId": payment_id,
            "number": None,
            "hostedInvoiceUrl": None,
            "invoicePdf": None,
            "amount": rzp_sub.get("paid_count", 0),
            "currency": "INR",
            "status": "paid",
            "created": int(time.time()),
            "periodStart": current_start,
            "periodEnd": current_end,
            "billingReason": "subscription_create",
            "provider": "razorpay",
        })

    print(f"[RZP] Payment verified → sub {sub_id}, payment {payment_id}, tier={tier}")
    return jsonify({"status": "success", "tier": tier}), 200


# ---------------------------------------------------------------------------
# POST /razorpay/webhook  — Razorpay webhook endpoint
# ---------------------------------------------------------------------------
@razorpay_bp.route("/webhook", methods=["POST"])
def razorpay_webhook():
    payload_bytes = request.get_data(as_text=False)
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not verify_razorpay_webhook_signature(payload_bytes, signature):
        print("[RZP WEBHOOK] Invalid signature")
        return jsonify({"error": "Invalid signature"}), 400

    try:
        import json
        event = json.loads(payload_bytes)
    except Exception:
        return jsonify({"error": "Invalid JSON payload"}), 400

    handle_razorpay_webhook_event(event)
    return jsonify({"status": "ok"}), 200


# ---------------------------------------------------------------------------
# GET /razorpay/status  — requires JWT
# Returns current Razorpay subscription status for the logged-in org.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/status", methods=["GET"])
@jwt_required()
def razorpay_status():
    user_id = get_jwt_identity()
    sub = _get_rzp_subscription_by_org(user_id)

    if not sub:
        return jsonify({"isActive": False, "subscription": None, "invoices": []}), 200

    tier = sub.get("tier")
    status = sub.get("status")
    period_end = sub.get("currentPeriodEnd", 0)
    is_active = is_subscription_active(status, period_end)
    org_id = sub.get("organizationId")

    plan = _get_plan_by_tier(tier) if tier else None

    # Fetch Razorpay invoices for this org
    raw_invoices = list(invoices_col.find(
        {"organizationId": org_id, "provider": "razorpay"},
        sort=[("created", -1)],
        limit=50,
    ))
    invoices_out = []
    for inv in raw_invoices:
        inv["_id"] = str(inv["_id"])
        if "organizationId" in inv:
            inv["organizationId"] = str(inv["organizationId"])
        invoices_out.append(inv)

    org = organizations_collection.find_one({"_id": ObjectId(user_id)}) or {}

    return jsonify({
        "isActive": is_active,
        "subscriptionTier": tier,
        "subscriptionStatus": status,
        "planName": plan.get("name", "") if plan else "",
        "planPrice": plan.get("price", 0) if plan else 0,
        "planFeatures": plan.get("features", []) if plan else [],
        "cvUsed": org.get("cvUsed", 0),
        "cvLimit": org.get("cvLimit", plan.get("cv_limit", 0) if plan else 0),
        "interviewUsed": org.get("interviewUsed", 0),
        "interviewLimit": org.get("interviewLimit", plan.get("interview_limit", 0) if plan else 0),
        "serviceType": org.get("serviceType", ""),
        "subscription": {
            "status": status,
            "tier": tier,
            "currentPeriodStart": sub.get("currentPeriodStart"),
            "currentPeriodEnd": period_end,
            "accessUntil": sub.get("accessUntil"),
            "willRenew": sub.get("willRenew", True),
            "cancelAtPeriodEnd": sub.get("cancelAtPeriodEnd", False),
            "razorpaySubscriptionId": sub.get("razorpaySubscriptionId"),
            "provider": "razorpay",
        },
        "invoices": invoices_out,
    }), 200


# ---------------------------------------------------------------------------
# POST /razorpay/cancel  — requires JWT
# Cancels the Razorpay subscription at period end.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/cancel", methods=["POST"])
@jwt_required()
def cancel_subscription():
    user_id = get_jwt_identity()
    sub = _get_rzp_subscription_by_org(user_id)

    if not sub:
        return jsonify({"error": "No active Razorpay subscription found"}), 400

    sub_id = sub.get("razorpaySubscriptionId")
    if not sub_id:
        return jsonify({"error": "No Razorpay subscription ID found"}), 400

    status = sub.get("status", "")
    if status in ("cancelled", "completed"):
        return jsonify({"error": "Subscription is already cancelled or completed"}), 400

    try:
        cancel_razorpay_subscription(sub_id, cancel_at_cycle_end=True)
        subscriptions_col.update_one(
            {"razorpaySubscriptionId": sub_id},
            {"$set": {"cancelAtPeriodEnd": True, "willRenew": False}},
        )
        return jsonify({"message": "Subscription will cancel at end of billing period"}), 200
    except Exception as exc:
        print(f"[RZP] Cancel failed: {exc}")
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /razorpay/upgrade/preview  — requires JWT
# Body: { "tier": "gold|platinum" }
# Returns proration details without mutating anything.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/upgrade/preview", methods=["POST"])
@jwt_required()
def upgrade_preview():
    user_id = get_jwt_identity()
    data = request.json or {}
    new_tier = data.get("tier", "").strip().lower()

    if not new_tier:
        return jsonify({"error": "tier is required"}), 400

    sub = _get_rzp_subscription_by_org(user_id)
    if not sub:
        return jsonify({"error": "No active Razorpay subscription found"}), 400

    current_tier = (sub.get("tier") or "").lower()

    if current_tier == new_tier:
        return jsonify({"error": f"You are already on the {current_tier} plan"}), 400

    if is_downgrade(current_tier, new_tier):
        return jsonify({"error": "Downgrades are not supported. They will apply at next cycle."}), 400

    current_plan = _get_plan_by_tier(current_tier)
    new_plan = _get_plan_by_tier(new_tier)

    if not new_plan:
        return jsonify({"error": f"Plan '{new_tier}' not found"}), 404

    if not new_plan.get("razorpay_plan_id"):
        return jsonify({"error": f"Plan '{new_tier}' has no Razorpay plan ID configured"}), 400

    current_price = float(current_plan.get("price", 0)) if current_plan else 0
    new_price = float(new_plan.get("price", 0))
    period_start = sub.get("currentPeriodStart") or int(time.time())
    period_end = sub.get("currentPeriodEnd") or compute_next_period_end(period_start)

    proration = calculate_proration(current_price, new_price, period_start, period_end)

    return jsonify({
        "currentTier": current_tier,
        "newTier": new_tier,
        "currentPlanPrice": current_price,
        "newPlanPrice": new_price,
        "unusedCredit": proration["unused_credit"],
        "proratedCharge": proration["prorated_charge"],
        "proratedChargeCents": proration["prorated_charge_cents"],
        "remainingDays": proration["remaining_days"],
        "totalDays": proration["total_days"],
        "periodEnd": period_end,
        "currency": "USD",
    }), 200


# ---------------------------------------------------------------------------
# POST /razorpay/upgrade/create-order  — requires JWT
# Body: { "tier": "gold|platinum" }
# Step 1 of upgrade: calculates proration and creates a Razorpay Order for
# the prorated amount. Does NOT touch the existing subscription yet.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/upgrade/create-order", methods=["POST"])
@jwt_required()
def upgrade_create_order():
    user_id = get_jwt_identity()
    data = request.json or {}
    new_tier = data.get("tier", "").strip().lower()

    if not new_tier:
        return jsonify({"error": "tier is required"}), 400

    org = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    sub = _get_rzp_subscription_by_org(user_id)
    if not sub:
        return jsonify({"error": "No active Razorpay subscription found"}), 400

    current_tier = (sub.get("tier") or "").lower()

    if current_tier == new_tier:
        return jsonify({"error": f"You are already on the {current_tier} plan"}), 400

    if is_downgrade(current_tier, new_tier):
        return jsonify({"error": "Downgrades are not supported mid-cycle."}), 400

    new_plan = _get_plan_by_tier(new_tier)
    if not new_plan or not new_plan.get("razorpay_plan_id"):
        return jsonify({"error": f"Plan '{new_tier}' not found or missing Razorpay plan ID"}), 400

    current_plan = _get_plan_by_tier(current_tier)
    current_price = float(current_plan.get("price", 0)) if current_plan else 0
    new_price = float(new_plan.get("price", 0))
    period_start = sub.get("currentPeriodStart") or int(time.time())
    period_end = sub.get("currentPeriodEnd") or compute_next_period_end(period_start)

    proration = calculate_proration(current_price, new_price, period_start, period_end)

    # prorated_charge is in USD; convert to cents (USD × 100). Minimum 50 cents.
    prorated_cents = max(proration["prorated_charge_cents"], 50)

    try:
        order = create_razorpay_order(
            amount_units=prorated_cents,
            currency="USD",
            notes={
                "org_id": str(user_id),
                "current_tier": current_tier,
                "new_tier": new_tier,
                "prorated_charge": str(proration["prorated_charge"]),
            },
        )
        order_id = order["id"]
        print(f"[RZP UPGRADE] Order {order_id} created for {current_tier}→{new_tier}, cents={prorated_cents}")

        return jsonify({
            "order_id": order_id,
            "key_id": RAZORPAY_KEY_ID,
            "amount": prorated_cents,
            "currency": "USD",
            "new_tier": new_tier,
            "current_tier": current_tier,
            "plan_name": new_plan.get("name"),
            "proration": proration,
            "org_name": org.get("organizationName", ""),
            "email": org.get("email", ""),
            "contact": org.get("phone", ""),
        }), 200

    except Exception as exc:
        print(f"[RZP UPGRADE] create-order failed: {exc}")
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /razorpay/upgrade/verify-order  — requires JWT
# Body: { "razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "new_tier" }
# Step 2 of upgrade: verifies order payment signature, cancels old subscription,
# creates new subscription for the upgraded tier, updates org limits.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/upgrade/verify-order", methods=["POST"])
@jwt_required()
def upgrade_verify_order():
    user_id = get_jwt_identity()
    data = request.json or {}
    order_id = data.get("razorpay_order_id", "")
    payment_id = data.get("razorpay_payment_id", "")
    signature = data.get("razorpay_signature", "")
    new_tier = data.get("new_tier", "").strip().lower()

    if not order_id or not payment_id or not signature or not new_tier:
        return jsonify({"error": "order_id, payment_id, signature and new_tier are required"}), 400

    if not verify_razorpay_order_signature(order_id, payment_id, signature):
        return jsonify({"error": "Invalid payment signature"}), 400

    org = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    sub = _get_rzp_subscription_by_org(user_id)
    if not sub:
        return jsonify({"error": "No active Razorpay subscription found"}), 400

    current_tier = (sub.get("tier") or "").lower()
    new_plan = _get_plan_by_tier(new_tier)
    if not new_plan or not new_plan.get("razorpay_plan_id"):
        return jsonify({"error": f"Plan '{new_tier}' not found or missing Razorpay plan ID"}), 400

    old_sub_id = sub.get("razorpaySubscriptionId")
    rzp_customer_id = sub.get("razorpayCustomerId") or org.get("razorpayCustomerId")

    try:
        # 1. Cancel old subscription immediately
        if old_sub_id:
            cancel_razorpay_subscription(old_sub_id, cancel_at_cycle_end=False)
            subscriptions_col.update_one(
                {"razorpaySubscriptionId": old_sub_id},
                {"$set": {"status": "cancelled", "willRenew": False, "cancelAtPeriodEnd": False}},
            )
            print(f"[RZP UPGRADE] Cancelled old sub {old_sub_id}")

        # 2. Create new subscription for the upgraded plan
        new_sub = create_razorpay_subscription(
            plan_id=new_plan["razorpay_plan_id"],
            customer_id=rzp_customer_id,
            notes={
                "org_id": str(user_id),
                "tier": new_tier,
                "upgraded_from": current_tier,
                "upgrade_order_id": order_id,
                "upgrade_payment_id": payment_id,
            },
        )
        new_sub_id = new_sub["id"]

        now_ts = int(time.time())
        period_end = compute_next_period_end(now_ts)

        # 3. Persist new subscription record
        subscriptions_col.insert_one({
            "organizationId": ObjectId(user_id),
            "razorpayCustomerId": rzp_customer_id,
            "razorpaySubscriptionId": new_sub_id,
            "razorpayPlanId": new_plan["razorpay_plan_id"],
            "tier": new_tier,
            "status": "active",
            "provider": "razorpay",
            "willRenew": True,
            "cancelAtPeriodEnd": False,
            "createdAt": now_ts,
            "currentPeriodStart": now_ts,
            "currentPeriodEnd": period_end,
            "accessUntil": period_end,
            "endedAt": None,
            "trialEnd": None,
            "upgradedFrom": current_tier,
            "upgradeOrderId": order_id,
            "upgradePaymentId": payment_id,
        })

        # 4. Update org limits for the new tier
        cv_limit = new_plan.get("cv_limit", 0)
        interview_limit = new_plan.get("interview_limit", 0)
        organizations_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"cvLimit": cv_limit, "interviewLimit": interview_limit, "cvUsed": 0, "interviewUsed": 0, "payment_status": "paid"}},
        )

        # 5. Record invoice
        invoices_col.insert_one({
            "organizationId": ObjectId(user_id),
            "razorpayOrderId": order_id,
            "razorpayPaymentId": payment_id,
            "invoiceId": payment_id,
            "amount": data.get("amount", 0),
            "currency": "INR",
            "status": "paid",
            "created": now_ts,
            "billingReason": "upgrade_proration",
            "provider": "razorpay",
            "upgradedFrom": current_tier,
            "upgradedTo": new_tier,
        })

        print(f"[RZP UPGRADE] {current_tier}→{new_tier} complete. New sub {new_sub_id}, payment {payment_id}")

        return jsonify({"status": "success", "tier": new_tier}), 200

    except Exception as exc:
        print(f"[RZP UPGRADE] verify-order failed: {exc}")
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /razorpay/repurchase  — requires JWT
# Allows an org to re-buy their current plan (e.g. Basic) when cv_limit is
# exhausted. Creates a fresh subscription for the same tier.
# ---------------------------------------------------------------------------
@razorpay_bp.route("/repurchase", methods=["POST"])
@jwt_required()
def repurchase_subscription():
    user_id = get_jwt_identity()

    org = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    sub = _get_rzp_subscription_by_org(user_id)
    if not sub:
        return jsonify({"error": "No existing Razorpay subscription found"}), 400

    tier = (sub.get("tier") or "").lower()
    plan = _get_plan_by_tier(tier)
    if not plan or not plan.get("razorpay_plan_id"):
        return jsonify({"error": f"Plan '{tier}' not found or missing Razorpay plan ID"}), 400

    rzp_customer_id = sub.get("razorpayCustomerId") or org.get("razorpayCustomerId")

    try:
        # Cancel any existing active/created subscription first
        old_sub_id = sub.get("razorpaySubscriptionId")
        if old_sub_id and sub.get("status") in ("active", "created", "authenticated"):
            cancel_razorpay_subscription(old_sub_id, cancel_at_cycle_end=False)
            subscriptions_col.update_one(
                {"razorpaySubscriptionId": old_sub_id},
                {"$set": {"status": "cancelled", "willRenew": False}},
            )
            print(f"[RZP REPURCHASE] Cancelled old sub {old_sub_id} for tier {tier}")

        # Create fresh subscription for the same plan
        new_sub = create_razorpay_subscription(
            plan_id=plan["razorpay_plan_id"],
            customer_id=rzp_customer_id,
            notes={
                "org_id": str(user_id),
                "tier": tier,
                "repurchase": "true",
            },
        )
        new_sub_id = new_sub["id"]

        subscriptions_col.insert_one({
            "organizationId": ObjectId(user_id),
            "razorpayCustomerId": rzp_customer_id,
            "razorpaySubscriptionId": new_sub_id,
            "razorpayPlanId": plan["razorpay_plan_id"],
            "tier": tier,
            "status": "created",
            "provider": "razorpay",
            "willRenew": True,
            "cancelAtPeriodEnd": False,
            "createdAt": int(time.time()),
            "currentPeriodStart": None,
            "currentPeriodEnd": None,
            "accessUntil": None,
            "repurchase": True,
        })

        print(f"[RZP REPURCHASE] New sub {new_sub_id} for org {user_id} tier {tier}")

        return jsonify({
            "success": True,
            "subscription_id": new_sub_id,
            "key_id": RAZORPAY_KEY_ID,
            "tier": tier,
            "plan_name": plan.get("name"),
            "amount": int(float(plan.get("price", 0)) * 100),
            "currency": "USD",
            "org_name": org.get("organizationName", ""),
            "email": org.get("email", ""),
            "contact": org.get("phone", ""),
        }), 200

    except Exception as exc:
        print(f"[RZP REPURCHASE] Failed: {exc}")
        return jsonify({"error": str(exc)}), 500
