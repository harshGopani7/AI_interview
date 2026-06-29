from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import (
    organizations_collection,
    db,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    FRONTEND_URL,
)
from bson import ObjectId
import stripe
import time as _time

stripe.api_key = STRIPE_SECRET_KEY

subscription_bp = Blueprint("subscription", __name__)
from config import subscriptions_col, pricing_col, invoices_col


def _get_plan_by_tier(tier):
    """Fetch a plan from the pricing collection by name (case-insensitive)."""
    return pricing_col.find_one({"name": {"$regex": f"^{tier}$", "$options": "i"}})


def _get_subscription_by_org_id(org_id):
    """Fetch the active subscription for an organization."""
    return subscriptions_col.find_one(
        {"organizationId": ObjectId(org_id)},
        sort=[("createdAt", -1)],
    )


# ---------------------------------------------------------------------------
# GET /subscription/plans  — public, returns tier cards from DB
# ---------------------------------------------------------------------------
@subscription_bp.route("/plans", methods=["GET"])
def get_plans():
    db_plans = list(pricing_col.find())
    plans = []
    for p in db_plans:
        plans.append({
            "tier": p["name"].lower(),
            "name": p["name"],
            "price": p.get("price", 0),
            "description": p.get("description", ""),
            "features": p.get("features", []),
            "isPopular": p.get("isPopular", False),
            "cv_limit": p.get("cv_limit", 0),
        })
    return jsonify({"plans": plans}), 200


# ---------------------------------------------------------------------------
# POST /subscription/create-checkout-session
# Body: { "email": "...", "tier": "basic|gold|platinum" }
# ---------------------------------------------------------------------------
@subscription_bp.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    data = request.json
    email = data.get("email", "").strip().lower()
    tier = data.get("tier", "").strip().lower()

    if not email or not tier:
        return jsonify({"error": "Email and tier are required"}), 400

    plan = _get_plan_by_tier(tier)
    if not plan or not plan.get("stripe_price_id"):
        return jsonify({"error": f"Plan '{tier}' not found or missing Stripe price ID"}), 400

    price_id = plan["stripe_price_id"]

    # Find existing organization or handle new signup
    user = organizations_collection.find_one({"email": email, "role": "organization"})
    stripe_customer_id = None
    
    if user:
        stripe_customer_id = user.get("stripeCustomerId")
        # For new organization signups, create Stripe customer immediately
        # Organization will be created after payment confirmation
        try:
            customer = stripe.Customer.create(
                email=email,
                name=user.get("organizationName", ""),
                metadata={
                    "pending_signup": "true",
                    "contact_person": user.get("contactPersonName", ""),
                    "phone": user.get("phone", ""),
                    "industry": user.get("industry", ""),
                    "company_size": user.get("companySize", ""),
                    "website": user.get("website", ""),
                }
            )
            stripe_customer_id = customer.id
            print(f"[DEBUG] Created new Stripe customer for pending signup: {stripe_customer_id}")
        except stripe.StripeError as e:
            return jsonify({"error": f"Failed to create Stripe customer: {str(e)}"}), 500
    else:
        return jsonify({"error": "Organization not found and no signup data provided"}), 404

    try:
        # If we have a customer ID, verify it exists; otherwise create a new one
        if stripe_customer_id:
            try:
                stripe.Customer.retrieve(stripe_customer_id)
                print(f"[DEBUG] Using existing Stripe customer: {stripe_customer_id}")
            except stripe.StripeError:
                print(f"[DEBUG] Existing customer {stripe_customer_id} not found, creating new one")
                stripe_customer_id = None

        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=email,
                name=user.get("organizationName", ""),
                metadata={"org_id": str(user["_id"])},
            )
            stripe_customer_id = customer.id
            organizations_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"stripeCustomerId": stripe_customer_id}},
            )

        # Prepare session metadata
        session_metadata = {"tier": tier}
        if user:
            session_metadata["org_id"] = str(user["_id"])

        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/subscribe?canceled=true",
            metadata=session_metadata,
        )

        return jsonify({"url": session.url}), 200

    except stripe.StripeError as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /subscription/webhook  — Stripe webhook handler
# ---------------------------------------------------------------------------
@subscription_bp.route("/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.get_data(as_text=False)
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        print("[WEBHOOK] Invalid payload")
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.SignatureVerificationError:
        print("[WEBHOOK] Invalid signature")
        return jsonify({"error": "Invalid signature"}), 400

    event_type = event["type"]
    obj = event["data"]["object"]
    print(f"[WEBHOOK] Received event: {event_type}")

    try:
        # ── 1. Checkout completed ──
        if event_type == "checkout.session.completed":
            metadata = obj.get("metadata", {})
            org_id_str = metadata.get("org_id")
            tier = metadata.get("tier")
            checkout_type = metadata.get("type", "new")  # "new" or "upgrade"
            sub_id = obj.get("subscription")
            cust_id = obj.get("customer")

            if org_id_str:
                oid = ObjectId(org_id_str)

                # Organization only stores stripeCustomerId for webhook lookups
                organizations_collection.update_one(
                    {"_id": oid},
                    {"$set": {"stripeCustomerId": cust_id}},
                )

                # ── New subscription checkout (mode=subscription)
                if sub_id:
                    subscriptions_col.update_one(
                        {"stripeSubscriptionId": sub_id},
                        {
                            "$set": {
                                "organizationId": oid,
                                "stripeCustomerId": cust_id,
                                "stripeSubscriptionId": sub_id,
                                "tier": tier,
                                "status": "active",
                            },
                            "$setOnInsert": {
                                "currentPeriodStart": None,
                                "currentPeriodEnd": None,
                                "accessUntil": None,
                                "createdAt": int(_time.time()),
                                "cancelAtPeriodEnd": False,
                                "endedAt": None,
                                "trialEnd": None,
                            },
                        },
                        upsert=True,
                    )
                    print(f"[WEBHOOK] new checkout → sub {sub_id} for org {oid}, tier={tier}")

        # ── 2. INVOICE SUCCEEDED — authoritative source for billing period ──
        elif event_type == "invoice.payment_succeeded":
            cust_id = obj.get("customer")
            hosted_url = obj.get("hosted_invoice_url")
            pdf_url = obj.get("invoice_pdf")

            # Extract the TRUE billing period from the line item
            line_items = obj.get("lines", {}).get("data", [])
            if line_items:
                line_item = line_items[0]
                period_start = line_item.get("period", {}).get("start")
                period_end = line_item.get("period", {}).get("end")
            else:
                period_start = obj.get("period_start")
                period_end = obj.get("period_end")

            print(f"[WEBHOOK] invoice.payment_succeeded → period_start={period_start}, period_end={period_end}")

            sub_id = obj.get("subscription") or (
                obj.get("parent", {}).get("subscription_details", {}).get("subscription")
            )

            org = organizations_collection.find_one({"stripeCustomerId": cust_id, "role": "organization"})
            if not org:
                print(f"[WEBHOOK] invoice.payment_succeeded → org not found for {cust_id}")
                return jsonify({"status": "ok"}), 200

            oid = org["_id"]

            # Update subscription record (keyed by stripeSubscriptionId)
            if sub_id:
                try:
                    s = stripe.Subscription.retrieve(sub_id)
                    update_data = {
                        "organizationId": oid,
                        "stripeCustomerId": cust_id,
                        "stripeSubscriptionId": sub_id,
                        "status": s.get("status", "active"),
                        "currentPeriodStart": period_start,
                        "currentPeriodEnd": period_end,
                        "accessUntil": period_end,
                        "createdAt": s.get("created"),
                        "hostedInvoiceUrl": hosted_url,
                        "invoicePdf": pdf_url,
                        "latestInvoiceId": obj.get("id"),
                    }

                    # Resolve the tier from the current Stripe price.
                    # This is critical for upgrades where the /upgrade route
                    # did NOT update the DB (because the invoice was "open").
                    s_items = s.get("items", {}).get("data", [])
                    if s_items:
                        price_id = s_items[0].get("price", {}).get("id")
                        if price_id:
                            matched = pricing_col.find_one({"stripe_price_id": price_id})
                            if matched:
                                update_data["tier"] = matched.get("name", "").lower()

                    subscriptions_col.update_one(
                        {"stripeSubscriptionId": sub_id},
                        {"$set": update_data},
                        upsert=True,
                    )
                except stripe.StripeError as e:
                    print(f"[WEBHOOK] Error retrieving subscription: {e}")

            # Insert invoice into separate invoices collection
            invoices_col.insert_one({
                "organizationId": oid,
                "stripeSubscriptionId": sub_id,
                "invoiceId": obj.get("id"),
                "number": obj.get("number"),
                "hostedInvoiceUrl": hosted_url,
                "invoicePdf": pdf_url,
                "amount": obj.get("amount_paid", 0),
                "currency": obj.get("currency", "usd"),
                "status": obj.get("status", "paid"),
                "created": obj.get("created"),
                "periodStart": period_start,
                "periodEnd": period_end,
                "billingReason": obj.get("billing_reason"),
            })

            # Set org limits from the plan's pricing doc and mark as paid
            tier_for_limits = update_data.get("tier") if sub_id else None
            if tier_for_limits:
                plan_doc = pricing_col.find_one({"name": {"$regex": f"^{tier_for_limits}$", "$options": "i"}})
                if plan_doc:
                    organizations_collection.update_one(
                        {"_id": oid},
                        {"$set": {
                            "cvLimit": plan_doc.get("cv_limit", 0),
                            "interviewLimit": plan_doc.get("interview_limit", 0),
                            "cvUsed": 0,
                            "interviewUsed": 0,
                            "payment_status": "paid",
                        }},
                    )

            print(f"[WEBHOOK] invoice.payment_succeeded → org {oid}, sub {sub_id}, access until {period_end}")

        # ── 3. Subscription updated — tier change on upgrade ──
        elif event_type == "customer.subscription.updated":
            sub_id = obj.get("id")
            cust_id = obj.get("customer")
            status = obj.get("status", "active")

            # Determine the new tier from the price → plan lookup
            items = obj.get("items", {}).get("data", [])
            new_price_id = items[0].get("price", {}).get("id") if items else None
            new_tier = None
            if new_price_id:
                matched_plan = pricing_col.find_one({"stripe_price_id": new_price_id})
                if matched_plan:
                    new_tier = matched_plan.get("name", "").lower()

            update_fields = {"status": status}
            if new_tier:
                update_fields["tier"] = new_tier

            subscriptions_col.update_one(
                {"stripeSubscriptionId": sub_id},
                {"$set": update_fields},
            )
            print(f"[WEBHOOK] subscription.updated → sub {sub_id}, status={status}, tier={new_tier}")

        # ── 4. Subscription deleted — mark everything inactive ──
        elif event_type == "customer.subscription.deleted":
            cust_id = obj.get("customer")
            sub_id = obj.get("id")
            ended_at = obj.get("ended_at")

            subscriptions_col.update_one(
                {"stripeSubscriptionId": sub_id},
                {"$set": {"status": "canceled", "endedAt": ended_at, "cancelAtPeriodEnd": False}},
            )
            print(f"[WEBHOOK] subscription.deleted → sub {sub_id}, cust {cust_id}")

    except Exception as e:
        print(f"[WEBHOOK] ERROR processing {event_type}: {e}")
        import traceback
        traceback.print_exc()

    return jsonify({"status": "ok"}), 200

# ---------------------------------------------------------------------------
# POST /subscription/cancel  — requires JWT, cancels at period end
# ---------------------------------------------------------------------------
@subscription_bp.route("/cancel", methods=["POST"])
@jwt_required()
def cancel_subscription():
    user_id = get_jwt_identity()

    # Read stripeSubscriptionId from subscriptions collection, not org
    subscription = _get_subscription_by_org_id(user_id)
    if not subscription:
        return jsonify({"error": "No active subscription found"}), 400

    sub_id = subscription.get("stripeSubscriptionId")
    if not sub_id:
        return jsonify({"error": "No active subscription found"}), 400

    try:
        result = stripe.Subscription.modify(sub_id, cancel_at_period_end=True)
        subscriptions_col.update_one(
            {"stripeSubscriptionId": sub_id},
            {"$set": {"cancelAtPeriodEnd": True}},
        )
        print(result)
        return jsonify({"message": "Subscription will cancel at end of billing period"}), 200
    except stripe.StripeError as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# GET /subscription/verify-session?session_id=...
# Called by PaymentSuccess page to confirm payment
# ---------------------------------------------------------------------------
@subscription_bp.route("/verify-session", methods=["GET"])
def verify_session():
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            org_id = session.get("metadata", {}).get("org_id")
            tier = session.get("metadata", {}).get("tier")
            organization_data = session.get("metadata", {}).get("organization_data")

            if org_id:
                # Organization only stores stripeCustomerId for webhook lookups
                organizations_collection.update_one(
                    {"_id": ObjectId(org_id)},
                    {"$set": {"stripeCustomerId": session.get("customer")}},
                )

                # Ensure subscription record exists (don't overwrite dates).
                # invoice.payment_succeeded is the authoritative source for dates.
                subscription_id = session.get("subscription")
                if subscription_id:
                    subscriptions_col.update_one(
                        {"stripeSubscriptionId": subscription_id},
                        {
                            "$set": {
                                "organizationId": ObjectId(org_id),
                                "stripeCustomerId": session.get("customer"),
                                "stripeSubscriptionId": subscription_id,
                                "tier": tier,
                                "status": "active",
                            },
                            "$setOnInsert": {
                                "currentPeriodStart": None,
                                "currentPeriodEnd": None,
                                "accessUntil": None,
                                "createdAt": int(_time.time()),
                                "cancelAtPeriodEnd": False,
                                "endedAt": None,
                                "trialEnd": None,
                            },
                        },
                        upsert=True,
                    )
                    print(f"[VERIFY] Subscription record ensured for org {org_id}, sub {subscription_id}")

            response_data = {"status": "paid", "tier": tier}
            
            # Include organization data for new signups
            if organization_data:
                try:
                    import json
                    parsed_org_data = json.loads(organization_data)
                    response_data["organizationData"] = parsed_org_data
                except (json.JSONDecodeError, Exception) as e:
                    print(f"[ERROR] Failed to parse organization data: {e}")
                    response_data["organizationData"] = organization_data

            return jsonify(response_data), 200
        else:
            return jsonify({"status": session.payment_status}), 200

    except stripe.StripeError as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# GET /subscription/status  — requires JWT, returns current plan info
# ---------------------------------------------------------------------------
@subscription_bp.route("/status", methods=["GET"])
@jwt_required()
def subscription_status():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # All subscription data now lives in the subscriptions collection
    subscription = _get_subscription_by_org_id(user_id)

    # Tier and status come from the subscription record
    tier = subscription.get("tier") if subscription else None
    status = subscription.get("status") if subscription else None

    # Resolve plan details from pricing collection
    plan = _get_plan_by_tier(tier) if tier else None

    # Determine if user currently has access
    is_active = status == "active"
    if not is_active and subscription:
        access_until = subscription.get("accessUntil")
        if access_until:
            is_active = _time.time() < access_until

    response_data = {
        "isActive": is_active,
        "subscriptionTier": tier,
        "subscriptionStatus": status,
        "planName": plan.get("name", "") if plan else "",
        "planPrice": plan.get("price", 0) if plan else 0,
        "planFeatures": plan.get("features", []) if plan else [],
        "stripeSubscriptionId": subscription.get("stripeSubscriptionId") if subscription else None,
        "cvUsed": user.get("cvUsed", 0),
        "cvLimit": user.get("cvLimit", plan.get("cv_limit", 0) if plan else 0),
        "interviewUsed": user.get("interviewUsed", 0),
        "interviewLimit": user.get("interviewLimit", plan.get("interview_limit", 0) if plan else 0),
        "serviceType": user.get("serviceType", ""),
    }

    # Add detailed subscription info if available
    if subscription:
        response_data["subscription"] = {
            "status": subscription.get("status"),
            "tier": tier,
            "provider": subscription.get("provider"),
            "currentPeriodStart": subscription.get("currentPeriodStart"),
            "currentPeriodEnd": subscription.get("currentPeriodEnd"),
            "accessUntil": subscription.get("accessUntil"),
            "cancelAtPeriodEnd": subscription.get("cancelAtPeriodEnd"),
            "createdAt": subscription.get("createdAt"),
            "trialEnd": subscription.get("trialEnd"),
            "endedAt": subscription.get("endedAt"),
            "hostedInvoiceUrl": subscription.get("hostedInvoiceUrl"),
            "invoicePdf": subscription.get("invoicePdf"),
            "latestInvoiceId": subscription.get("latestInvoiceId"),
        }

    # Fetch invoices from separate invoices collection
    org_invoices = list(
        invoices_col.find(
            {"organizationId": ObjectId(user_id)},
            {"_id": 0, "organizationId": 0},
        ).sort("created", -1)
    )
    if org_invoices:
        response_data["invoices"] = org_invoices

    return jsonify(response_data), 200


# ---------------------------------------------------------------------------
# Helper: validate upgrade tier and return (current_sub, sub_id, current_tier,
# new_tier, plan) or a Flask error response.
# ---------------------------------------------------------------------------
def _validate_upgrade(user_id, new_tier_raw):
    current_sub = _get_subscription_by_org_id(user_id)
    if not current_sub:
        return None, jsonify({"error": "No active subscription found. Please subscribe first."}), 400

    current_tier = (current_sub.get("tier", "") or "").lower()
    sub_id = current_sub.get("stripeSubscriptionId")
    if not sub_id:
        return None, jsonify({"error": "No Stripe subscription ID found."}), 400

    new_tier = new_tier_raw.strip().lower()
    tier_hierarchy = ["basic", "gold", "platinum"]

    if current_tier in tier_hierarchy and new_tier in tier_hierarchy:
        ci = tier_hierarchy.index(current_tier)
        ni = tier_hierarchy.index(new_tier)
        if ni < ci:
            return None, jsonify({"error": f"Downgrades are not allowed. Cannot go from {current_tier} to {new_tier}."}), 400
        if ni == ci:
            return None, jsonify({"error": f"You are already on the {current_tier} plan."}), 400

    plan = _get_plan_by_tier(new_tier)
    if not plan or not plan.get("stripe_price_id"):
        return None, jsonify({"error": f"Plan '{new_tier}' not found or missing Stripe price ID"}), 400

    return {
        "current_sub": current_sub,
        "sub_id": sub_id,
        "current_tier": current_tier,
        "new_tier": new_tier,
        "plan": plan,
    }, None, None


# ---------------------------------------------------------------------------
# POST /subscription/upgrade/preview  — requires JWT
# Body: { "tier": "gold|platinum" }
# Returns the exact amount Stripe will charge using a "reset cycle"
# approach: billing_cycle_anchor resets to today, so the customer gets
# a credit for unused time on the old plan and pays the full new plan
# price minus that credit.  Read-only — no mutation happens here.
# ---------------------------------------------------------------------------
@subscription_bp.route("/upgrade/preview", methods=["POST"])
@jwt_required()
def upgrade_preview():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    result, err_resp, err_code = _validate_upgrade(user_id, data.get("tier", ""))
    if err_resp:
        return err_resp, err_code

    sub_id = result["sub_id"]
    new_price_id = result["plan"]["stripe_price_id"]

    try:
        stripe_sub = stripe.Subscription.retrieve(sub_id)
        if not stripe_sub or not stripe_sub.get("items", {}).get("data"):
            return jsonify({"error": "Could not retrieve subscription from Stripe."}), 400

        current_item_id = stripe_sub["items"]["data"][0]["id"]

        preview = stripe.Invoice.create_preview(
            customer=stripe_sub["customer"],
            subscription=sub_id,
            subscription_details={
                "items": [{
                    "id": current_item_id,
                    "price": new_price_id,
                }],
                "proration_behavior": "always_invoice",
                "billing_cycle_anchor": "now",
            },
        )

        lines = []
        for li in preview.get("lines", {}).get("data", []):
            lines.append({
                "description": li.get("description", ""),
                "amount": li.get("amount", 0),
                "currency": li.get("currency", "usd"),
                "proration": li.get("proration", False),
            })

        amount_due = preview.get("amount_due", 0)
        print(f"[UPGRADE PREVIEW] lines={lines}, amount_due={amount_due}")

        return jsonify({
            "amountDue": amount_due,
            "currency": preview.get("currency", "usd"),
            "lines": lines,
            "periodEnd": int(_time.time()) + 30 * 24 * 3600,  # ~1 month from now
        }), 200

    except stripe.StripeError as e:
        print(f"[UPGRADE PREVIEW] Stripe error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /subscription/upgrade  — requires JWT
# Body: { "tier": "gold|platinum" }
# "Reset Cycle" upgrade: swaps the price, resets billing_cycle_anchor to
# today, and forces an invoice.  The customer gets a credit for unused
# time on the old plan and pays the full new-plan price minus that credit.
# Next renewal is exactly one month from today.
# ---------------------------------------------------------------------------
@subscription_bp.route("/upgrade", methods=["POST"])
@jwt_required()
def upgrade_subscription():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    result, err_resp, err_code = _validate_upgrade(user_id, data.get("tier", ""))
    if err_resp:
        return err_resp, err_code

    sub_id = result["sub_id"]
    current_tier = result["current_tier"]
    new_tier = result["new_tier"]
    new_price_id = result["plan"]["stripe_price_id"]

    try:
        # 1. Retrieve the current Stripe subscription
        stripe_sub = stripe.Subscription.retrieve(sub_id)
        if not stripe_sub or not stripe_sub.get("items", {}).get("data"):
            return jsonify({"error": "Could not retrieve subscription from Stripe."}), 400

        current_item_id = stripe_sub["items"]["data"][0]["id"]

        # 2. Modify the subscription with "Reset Cycle" behaviour:
        #    - billing_cycle_anchor="now"   → restart the cycle from today
        #    - proration_behavior="always_invoice" → force an invoice with
        #      credit for unused old-plan time + full new-plan charge
        #    - payment_behavior="allow_incomplete" → keep sub active even
        #      if the invoice isn't paid immediately
        updated_sub = stripe.Subscription.modify(
            sub_id,
            items=[{"id": current_item_id, "price": new_price_id}],
            billing_cycle_anchor="now",
            proration_behavior="always_invoice",
            payment_behavior="allow_incomplete",
        )

        # 3. Retrieve the latest invoice Stripe just created.
        latest_invoice_id = updated_sub.get("latest_invoice")
        if not latest_invoice_id:
            # No invoice generated (shouldn't happen with always_invoice)
            print(f"[UPGRADE] WARNING: no invoice generated for {sub_id}")
            return jsonify({
                "url": f"{FRONTEND_URL}/organization/dashboard/subscription?upgraded=true"
            }), 200

        inv = stripe.Invoice.retrieve(latest_invoice_id)
        inv_status = inv.get("status")
        amount_due = inv.get("amount_due", 0)

        print(f"[UPGRADE] invoice {latest_invoice_id}: status={inv_status}, amount_due={amount_due}")

        if inv_status == "paid":
            # Card on file was charged instantly — safe to update DB now.
            subscriptions_col.update_one(
                {"stripeSubscriptionId": sub_id},
                {"$set": {
                    "tier": new_tier,
                    "status": updated_sub.get("status", "active"),
                }},
            )
            print(f"[UPGRADE] {current_tier} → {new_tier} for org {user_id}, paid instantly")
            return jsonify({
                "success": True,
                "url": f"{FRONTEND_URL}/organization/dashboard/subscription?upgraded=true",
            }), 200

        # Invoice is "open" (card declined / no payment method / pending).
        # Do NOT update the DB tier — the webhook invoice.payment_succeeded
        # will handle it once the customer pays via the hosted invoice page.
        hosted_url = inv.get("hosted_invoice_url")
        if hosted_url:
            print(f"[UPGRADE] {current_tier} → {new_tier} for org {user_id}, invoice open → redirecting to pay")
            return jsonify({"url": hosted_url}), 200

        # Fallback: invoice exists but no hosted URL (edge case)
        print(f"[UPGRADE] {current_tier} → {new_tier} for org {user_id}, invoice {inv_status} but no hosted URL")
        return jsonify({
            "error": "Payment required but no payment page available. Please check your Stripe dashboard."
        }), 500

    except stripe.StripeError as e:
        print(f"[UPGRADE] Stripe error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# POST /subscription/repurchase  — requires JWT
# Creates a new Stripe Checkout session for the SAME plan the org is on.
# Used when cv_limit is exhausted and the org wants to top-up / renew.
# ---------------------------------------------------------------------------
@subscription_bp.route("/repurchase", methods=["POST"])
@jwt_required()
def repurchase_subscription():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    current_sub = _get_subscription_by_org_id(user_id)
    if not current_sub:
        return jsonify({"error": "No active subscription found"}), 400

    tier = (current_sub.get("tier") or "").lower()
    plan = _get_plan_by_tier(tier)
    if not plan or not plan.get("stripe_price_id"):
        return jsonify({"error": f"Plan '{tier}' not found or missing Stripe price ID"}), 400

    stripe_customer_id = current_sub.get("stripeCustomerId") or user.get("stripeCustomerId")

    try:
        session_params = {
            "mode": "subscription",
            "line_items": [{"price": plan["stripe_price_id"], "quantity": 1}],
            "success_url": f"{FRONTEND_URL}/organization/dashboard/subscription?repurchased=true",
            "cancel_url": f"{FRONTEND_URL}/organization/dashboard/billing",
            "metadata": {
                "org_id": str(user_id),
                "tier": tier,
                "repurchase": "true",
            },
        }
        if stripe_customer_id:
            session_params["customer"] = stripe_customer_id
        else:
            session_params["customer_email"] = user.get("email", "")

        session = stripe.checkout.Session.create(**session_params)
        print(f"[REPURCHASE] Stripe checkout session {session.id} for org {user_id} tier {tier}")
        return jsonify({"url": session.url}), 200

    except stripe.StripeError as e:
        print(f"[REPURCHASE] Stripe error: {e}")
        return jsonify({"error": str(e)}), 500
