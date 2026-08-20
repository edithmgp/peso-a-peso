"""
Continuous Learning Meta-Agent (Sprint 5)
Learns from user feedback to adapt sensitivity thresholds and communication tone in persistent memory.
"""

import time
import logging
from app.agents.base import BaseAgent
from app.schemas.agents import AgentContext, AgentResult
from app.services.profile_service import ProfileService
from app.services.category_service import CategoryService
from app.services.db_service import DatabaseService
from app.core.database import get_service_db, get_db

logger = logging.getLogger(__name__)


class MetaAgent(BaseAgent):
    """
    Meta-Agent responsible for continuous learning:
    Modifies category sensitivity weights in user profile based on feedback signals.
    """

    def __init__(self):
        super().__init__(name="meta_agent")

    async def execute(self, context: AgentContext) -> AgentResult:
        start_time = time.perf_counter()

        feedback = context.metadata.get("feedback", "useful")
        alert_id = context.metadata.get("alert_id")
        useful = (feedback == "useful")

        # Determine category slug from alert or metadata
        category_slug = context.metadata.get("category_slug", "other")

        if alert_id and category_slug == "other":
            client = get_service_db() or get_db()
            if client is not None:
                try:
                    alert_res = client.table("alerts").select("category_id").eq("id", str(alert_id)).execute()
                    if alert_res.data and alert_res.data[0].get("category_id"):
                        cat_id = alert_res.data[0]["category_id"]
                        categories = await CategoryService.get_all()
                        for c in categories:
                            if c["id"] == cat_id:
                                category_slug = c["slug"]
                                break
                except Exception as e:
                    logger.error(f"Error resolving alert category in MetaAgent: {e}")

        # Execute adaptation rule
        adaptation = await ProfileService.adapt_category_score(
            user_id=context.user_id,
            category_slug=category_slug,
            useful=useful,
        )

        duration_ms = max(1, int((time.perf_counter() - start_time) * 1000))
        output_data = {
            "category_slug": category_slug,
            "feedback": feedback,
            "previous_score": adaptation["previous_score"],
            "new_score": adaptation["new_score"],
            "adapted": True,
        }

        # Observability trace logging
        await DatabaseService.log_agent_event(
            user_id=context.user_id,
            request_id=context.request_id,
            agent_name=self.name,
            event_type="profile_adapted",
            input_data={"alert_id": str(alert_id), "feedback": feedback},
            output_data=output_data,
            status="success",
            duration_ms=duration_ms,
        )

        return AgentResult(
            agent_name=self.name,
            status="success",
            duration_ms=duration_ms,
            output=output_data,
        )
