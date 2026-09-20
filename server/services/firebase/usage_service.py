import datetime
import json
import httpx
from config.settings import settings
from services.firebase.plan_service import get_plan_limits_sync as get_plan_limits, PLAN_STARTER
from utils.logger import get_logger

logger = get_logger(__name__)

CYCLE_SECONDS = 30 * 24 * 60 * 60


def compute_user_billing_period(created_at_val: str | None = None, started_at_val: str | None = None, plan_id: str | None = None) -> str:
    """
    Computes a 30-day rolling billing cycle key (YYYY-MM-DD_planId) based on signup or subscription start.
    Advances every 30 days automatically.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    base_dt = None

    date_str = started_at_val or created_at_val
    if date_str:
        try:
            clean_str = str(date_str).replace("Z", "+00:00")
            base_dt = datetime.datetime.fromisoformat(clean_str)
        except Exception:
            base_dt = None

    if not base_dt:
        base_dt = now

    if base_dt.tzinfo is None:
        base_dt = base_dt.replace(tzinfo=datetime.timezone.utc)

    elapsed_seconds = max(0.0, (now - base_dt).total_seconds())
    cycle_index = int(elapsed_seconds // CYCLE_SECONDS)
    cycle_start = base_dt + datetime.timedelta(seconds=cycle_index * CYCLE_SECONDS)
    date_key = f"{cycle_start.year}-{cycle_start.month:02d}-{cycle_start.day:02d}"
    clean_plan = plan_id or PLAN_STARTER
    return f"{date_key}_{clean_plan}"


def get_current_period(plan_id: str = PLAN_STARTER) -> str:
    """Returns standard default period string."""
    return compute_user_billing_period(plan_id=plan_id)


def compute_effective_subscription(fields: dict) -> dict:
    """
    Evaluates subscription fields and enforces plan lifecycle rules:
    1. Sign up day starts billing period on free Starter plan.
    2. Plan purchase date is the new starting date for 30-day billing cycle.
    3. When paid plan ends (now >= valid_until), user goes to free default plan (Starter)
       and that expiration day becomes the new starting day of the billing period.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    subscription_map = fields.get("subscription", {}).get("mapValue", {}).get("fields", {})

    plan_id = subscription_map.get("planId", {}).get("stringValue") or PLAN_STARTER
    status = subscription_map.get("status", {}).get("stringValue") or "active"
    valid_until = (
        subscription_map.get("validUntil", {}).get("stringValue")
        or subscription_map.get("validUntil", {}).get("timestampValue")
        or None
    )
    started_at = (
        subscription_map.get("startedAt", {}).get("stringValue")
        or subscription_map.get("startedAt", {}).get("timestampValue")
        or None
    )
    created_at = (
        fields.get("createdAt", {}).get("timestampValue")
        or fields.get("createdAt", {}).get("stringValue")
        or None
    )

    valid_until_dt = None
    if valid_until:
        try:
            clean_str = str(valid_until).replace("Z", "+00:00")
            valid_until_dt = datetime.datetime.fromisoformat(clean_str)
            if valid_until_dt.tzinfo is None:
                valid_until_dt = valid_until_dt.replace(tzinfo=datetime.timezone.utc)
        except Exception:
            valid_until_dt = None

    # Check if paid plan has expired
    if plan_id != PLAN_STARTER and valid_until_dt and now >= valid_until_dt:
        # Revert to Starter; expiration day is the new billing period start date
        starter_valid_until_dt = valid_until_dt + datetime.timedelta(seconds=CYCLE_SECONDS)
        starter_valid_until_str = starter_valid_until_dt.isoformat().replace("+00:00", "Z")
        period_key = compute_user_billing_period(started_at_val=valid_until, created_at_val=created_at, plan_id=PLAN_STARTER)
        return {
            "planId": PLAN_STARTER,
            "status": "active",
            "validUntil": starter_valid_until_str,
            "startedAt": valid_until,
            "createdAt": created_at,
            "period": period_key,
            "isExpired": True,
            "originalPlanId": plan_id,
        }

    period_key = compute_user_billing_period(started_at_val=started_at, created_at_val=created_at, plan_id=plan_id)
    return {
        "planId": plan_id,
        "status": status,
        "validUntil": valid_until,
        "startedAt": started_at,
        "createdAt": created_at,
        "period": period_key,
        "isExpired": False,
        "originalPlanId": plan_id,
    }


async def get_user_subscription(user_id: str | None) -> dict:
    """
    Fetches user subscription from Firestore users collection via REST API.
    Defaults to Starter plan if user_id is missing or doc doesn't exist.
    """
    if not user_id:
        return {"planId": PLAN_STARTER, "status": "active", "period": get_current_period()}

    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("FIREBASE_PROJECT_ID is not configured. Defaulting to Starter plan.")
        return {"planId": PLAN_STARTER, "status": "active", "period": get_current_period()}

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/users/{user_id}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                doc_data = response.json()
                fields = doc_data.get("fields", {})
                return compute_effective_subscription(fields)
            elif response.status_code == 404:
                logger.info(f"User profile {user_id} not found in Firestore. Using default Starter plan.")
            else:
                logger.warning(f"Failed to fetch user {user_id} subscription: status {response.status_code}")
    except Exception as e:
        logger.warning(f"Error checking user subscription for {user_id}: {e}")

    return {"planId": PLAN_STARTER, "status": "active", "period": get_current_period()}


async def get_user_monthly_usage(user_id: str | None, period: str | None = None) -> dict:
    """
    Fetches the user's active 30-day billing cycle usage count from Firestore.
    """
    if not user_id:
        return {"notesGenerated": 0, "videoQaQuestions": 0, "assistantQuestions": 0}

    cur_period = period
    if not cur_period:
        user_sub = await get_user_subscription(user_id)
        cur_period = user_sub.get("period") or get_current_period()

    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        return {"notesGenerated": 0, "videoQaQuestions": 0, "assistantQuestions": 0}

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/users/{user_id}/usage/{cur_period}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                doc_data = response.json()
                fields = doc_data.get("fields", {})
                
                notes_gen = int(fields.get("notesGenerated", {}).get("integerValue") or 0)
                qa_count = int(fields.get("videoQaQuestions", {}).get("integerValue") or 0)
                asst_count = int(fields.get("assistantQuestions", {}).get("integerValue") or 0)
                
                return {
                    "notesGenerated": notes_gen,
                    "videoQaQuestions": qa_count,
                    "assistantQuestions": asst_count,
                }
    except Exception as e:
        logger.warning(f"Error fetching monthly usage for {user_id}: {e}")

    return {"notesGenerated": 0, "videoQaQuestions": 0, "assistantQuestions": 0}

    return {"notesGenerated": 0, "videoQaQuestions": 0, "assistantQuestions": 0}


def format_duration_display(seconds: int) -> str:
    """Helper to format seconds into a clean display string like '2h' or '45m'."""
    hrs = round(seconds / 3600, 1)
    if hrs >= 1:
        return f"{int(hrs)}h" if hrs.is_integer() else f"{hrs}h"
    return f"{round(seconds / 60)}m"


async def check_can_generate_notes(
    user_id: str | None,
    video_duration_seconds: int = 0
) -> tuple[bool, str, bool]:
    """
    Validates whether user is allowed to generate lecture notes for a given video.
    Checks:
      1. Video duration limit against user's plan cap.
      2. Monthly notes quota for the active 30-day billing cycle.
    Returns:
      (allowed: bool, reason: str, is_priority: bool)
    """
    try:
        user_sub = await get_user_subscription(user_id)
        plan_limits = get_plan_limits(user_sub.get("planId"))
        is_priority = bool(plan_limits.get("priority_queue", False))
        plan_name = plan_limits.get("name", "Starter")

        # 1. Video Duration Cap Check
        max_duration_sec = plan_limits.get("max_video_duration_seconds", 2 * 60 * 60)
        if video_duration_seconds > 0 and video_duration_seconds > max_duration_sec:
            duration_display = format_duration_display(video_duration_seconds)
            max_display = format_duration_display(max_duration_sec)
            return (
                False,
                f"Video length ({duration_display}) exceeds your {plan_name} plan limit of {max_display}. Please upgrade to process longer lectures.",
                is_priority,
            )

        # 2. Monthly Notes Quota Check
        if user_id:
            cur_period = user_sub.get("period") or get_current_period()
            monthly_usage = await get_user_monthly_usage(user_id, cur_period)
            notes_used = monthly_usage.get("notesGenerated", 0)
            base_quota = plan_limits.get("monthly_notes_quota", 10)

            if notes_used >= base_quota:
                return (
                    False,
                    f"Monthly note generation limit reached ({notes_used}/{base_quota}) for your {plan_name} plan. Please upgrade to unlock more note sessions.",
                    is_priority,
                )

        return True, "", is_priority

    except Exception as e:
        logger.warning(f"Error checking note generation eligibility for user {user_id}: {e}")
        return True, "", False


async def check_can_ask_question(user_id: str | None) -> tuple[bool, str]:
    """
    Validates if user is allowed to ask a doubt or chat with assistant in their active 30-day cycle.
    Returns (allowed: bool, reason: str).
    """
    if not user_id:
        return True, ""

    try:
        user_sub = await get_user_subscription(user_id)
        plan_limits = get_plan_limits(user_sub.get("planId"))
        cur_period = user_sub.get("period") or get_current_period()
        monthly_usage = await get_user_monthly_usage(user_id, cur_period)
        
        total_chats_used = monthly_usage.get("videoQaQuestions", 0) + monthly_usage.get("assistantQuestions", 0)
        total_allowed = plan_limits.get("monthly_chat_quota", 75)

        if total_chats_used >= total_allowed:
            return False, f"Monthly Guruji doubt limit reached ({total_chats_used}/{total_allowed}) for your {plan_limits.get('name', 'Starter')} plan. Please upgrade to unlock more questions."
    except Exception as e:
        logger.warning(f"Error validating chat quota for {user_id}: {e}")

    return True, ""


async def increment_user_usage(user_id: str | None, field_name: str, amount: int = 1) -> None:
    """
    Increments a usage field for the user in Firestore for their active 30-day billing cycle.
    Uses patch to upsert current cycle's usage document.
    """
    if not user_id:
        return

    user_sub = await get_user_subscription(user_id)
    cur_period = user_sub.get("period") or get_current_period()

    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        return

    # First fetch current usage
    current_usage = await get_user_monthly_usage(user_id, cur_period)
    new_value = current_usage.get(field_name, 0) + amount

    plan_id = user_sub.get("planId") or PLAN_STARTER
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/users/{user_id}/usage/{cur_period}?updateMask.fieldPaths={field_name}&updateMask.fieldPaths=period&updateMask.fieldPaths=planId&updateMask.fieldPaths=lastUpdated"
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

    payload = {
        "fields": {
            "period": {"stringValue": cur_period},
            "planId": {"stringValue": plan_id},
            field_name: {"integerValue": str(new_value)},
            "lastUpdated": {"timestampValue": now_str},
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.patch(url, json=payload, timeout=5.0)
            if res.status_code not in (200, 201):
                logger.warning(f"Failed to increment {field_name} for {user_id}: {res.status_code}")
    except Exception as e:
        logger.warning(f"Error updating usage count for user {user_id}: {e}")


