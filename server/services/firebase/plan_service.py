import time
import json
import httpx
from typing import Dict, Any, Optional
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

PLAN_STARTER = "starter"
PLAN_LEARNER = "learner"
PLAN_SCHOLAR = "scholar"

# Fallback default plans in case Firestore is unreachable
DEFAULT_PLANS: Dict[str, Dict[str, Any]] = {
    PLAN_STARTER: {
        "id": PLAN_STARTER,
        "name": "Starter",
        "price": 0,
        "billing_interval": "month",
        "max_video_duration_seconds": 2 * 60 * 60,  # 2 hours
        "monthly_notes_quota": 10,
        "monthly_chat_quota": 75,
        "priority_queue": False,
        "rank": 0,
    },
    "learner": {
        "id": "learner",
        "name": "Learner",
        "price": 119,
        "billing_interval": "month",
        "max_video_duration_seconds": 7 * 60 * 60,  # 7 hours
        "monthly_notes_quota": 50,
        "monthly_chat_quota": 1000,
        "priority_queue": False,
        "rank": 1,
    },
    "scholar": {
        "id": "scholar",
        "name": "Scholar",
        "price": 349,
        "billing_interval": "month",
        "max_video_duration_seconds": 15 * 60 * 60,  # 15 hours
        "monthly_notes_quota": 100,
        "monthly_chat_quota": 3000,
        "priority_queue": True,
        "rank": 2,
    },
}

# In-memory cache for high performance
_plans_cache: Dict[str, Dict[str, Any]] = {}
_last_cache_time: float = 0
CACHE_TTL_SECONDS = 300.0  # 5 minutes


def _parse_firestore_value(field_val: dict) -> Any:
    """Helper to parse a Firestore REST API typed value."""
    if "stringValue" in field_val:
        return field_val["stringValue"]
    if "integerValue" in field_val:
        return int(field_val["integerValue"])
    if "doubleValue" in field_val:
        return float(field_val["doubleValue"])
    if "booleanValue" in field_val:
        return field_val["booleanValue"]
    if "mapValue" in field_val:
        sub_fields = field_val["mapValue"].get("fields", {})
        return {k: _parse_firestore_value(v) for k, v in sub_fields.items()}
    if "arrayValue" in field_val:
        values = field_val["arrayValue"].get("values", [])
        return [_parse_firestore_value(v) for v in values]
    if "nullValue" in field_val:
        return None
    return None


def _parse_plan_doc(doc_data: dict) -> Dict[str, Any]:
    """Parses Firestore document fields into a clean plan dict."""
    fields = doc_data.get("fields", {})
    name = doc_data.get("name", "")
    plan_id = name.split("/")[-1] if name else ""

    parsed: Dict[str, Any] = {"id": plan_id}
    for k, v in fields.items():
        parsed[k] = _parse_firestore_value(v)

    limits = parsed.get("limits", {})
    # Map camelCase to snake_case for backend compatibility
    return {
        "id": parsed.get("id", plan_id),
        "name": parsed.get("name", plan_id.title()),
        "price": parsed.get("price", 0),
        "billing_interval": parsed.get("billingInterval", "month"),
        "max_video_duration_seconds": limits.get("maxVideoDurationSeconds", DEFAULT_PLANS.get(plan_id, {}).get("max_video_duration_seconds", 7200)),
        "monthly_notes_quota": limits.get("monthlyNotesQuota", DEFAULT_PLANS.get(plan_id, {}).get("monthly_notes_quota", 10)),
        "monthly_chat_quota": limits.get("monthlyChatQuota", DEFAULT_PLANS.get(plan_id, {}).get("monthly_chat_quota", 75)),
        "priority_queue": bool(limits.get("priorityQueue", False)),
        "rank": parsed.get("rank", DEFAULT_PLANS.get(plan_id, {}).get("rank", 0)),
        "raw": parsed,
    }


async def fetch_plans_from_firestore() -> Dict[str, Dict[str, Any]]:
    """
    Queries Firestore REST API for all documents in 'plans' collection.
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        return DEFAULT_PLANS

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/plans"
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, timeout=5.0)
            if res.status_code == 200:
                data = res.json()
                documents = data.get("documents", [])
                if not documents:
                    await seed_default_plans_if_empty()
                    return DEFAULT_PLANS

                result = {}
                for doc_item in documents:
                    plan = _parse_plan_doc(doc_item)
                    if plan["id"]:
                        result[plan["id"]] = plan

                return result if result else DEFAULT_PLANS
            elif res.status_code == 404:
                logger.info("Plans collection not found in Firestore. Seeding defaults...")
                await seed_default_plans_if_empty()
    except Exception as e:
        logger.warning(f"Error fetching dynamic plans from Firestore: {e}")

    return DEFAULT_PLANS


async def get_dynamic_plans(force_refresh: bool = False) -> Dict[str, Dict[str, Any]]:
    """
    Returns cached dynamic plans or fetches fresh ones if cache expired.
    """
    global _plans_cache, _last_cache_time
    now = time.time()

    if not force_refresh and _plans_cache and (now - _last_cache_time < CACHE_TTL_SECONDS):
        return _plans_cache

    try:
        fresh_plans = await fetch_plans_from_firestore()
        if fresh_plans:
            _plans_cache = fresh_plans
            _last_cache_time = now
            return _plans_cache
    except Exception as e:
        logger.warning(f"Failed to refresh plans cache: {e}")

    return _plans_cache if _plans_cache else DEFAULT_PLANS


async def get_plan_limits(plan_id: str | None) -> Dict[str, Any]:
    """
    Returns the limit config for a plan ID (e.g. 'starter', 'learner', 'scholar').
    """
    plans = await get_dynamic_plans()
    target_id = plan_id or "starter"
    return plans.get(target_id, DEFAULT_PLANS.get(target_id, DEFAULT_PLANS["starter"]))


def get_plan_limits_sync(plan_id: str | None) -> Dict[str, Any]:
    """
    Synchronous fallback for places needing immediate synchronous limits.
    """
    target_id = plan_id or "starter"
    if _plans_cache and target_id in _plans_cache:
        return _plans_cache[target_id]
    return DEFAULT_PLANS.get(target_id, DEFAULT_PLANS["starter"])


async def seed_default_plans_if_empty() -> None:
    """
    Seeds default plan documents into Firestore if they don't exist.
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        return

    for plan_id, plan_data in DEFAULT_PLANS.items():
        url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/plans/{plan_id}"
        payload = {
            "fields": {
                "id": {"stringValue": plan_id},
                "name": {"stringValue": plan_data["name"]},
                "price": {"integerValue": str(plan_data["price"])},
                "billingInterval": {"stringValue": plan_data["billing_interval"]},
                "rank": {"integerValue": str(plan_data.get("rank", 0))},
                "limits": {
                    "mapValue": {
                        "fields": {
                            "maxVideoDurationSeconds": {"integerValue": str(plan_data["max_video_duration_seconds"])},
                            "monthlyNotesQuota": {"integerValue": str(plan_data["monthly_notes_quota"])},
                            "monthlyChatQuota": {"integerValue": str(plan_data["monthly_chat_quota"])},
                            "priorityQueue": {"booleanValue": plan_data["priority_queue"]},
                        }
                    }
                }
            }
        }
        try:
            async with httpx.AsyncClient() as client:
                await client.patch(url, json=payload, timeout=5.0)
        except Exception as e:
            logger.warning(f"Error seeding plan {plan_id} into Firestore: {e}")
