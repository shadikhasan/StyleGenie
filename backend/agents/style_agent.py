import os
import json
from typing import Union

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy

from agents.stylist_types import StylistRequestPayload, AIRecommendations

load_dotenv()


# --------- 1. System prompt that defines behavior --------- #

SYSTEM_PROMPT = """
You are an AI personal stylist for an app called StyleGenie.

You receive a single JSON payload with:
- user_info {gender, skin_tone, color_preferences, face_shape, body_shape}
- drawer_products: array of wardrobe items the user actually owns (each has an id)
- location: trip destination / city (e.g. "Dhaka", "NYC")
- occasion: what they are dressing for (e.g. "business meeting", "wedding", "date night")
- datetime: ISO8601 timestamp for when the user will wear the outfit
  (You or the calling system can use this with the location to infer weather/season/time-of-day.)

Your job:
- Propose 5 complete outfits using ONLY items from drawer_products.
- For each outfit, select relevant product_ids from drawer_products.
- Write a detailed, friendly description that explains WHY this outfit works.
  - When helpful, mention: body shape, face shape, skin tone, location, weather/season,
    time of day, and occasion (but don't force all of them every time if unnatural).
- DO NOT invent new products. Use only ids that actually exist in drawer_products.

You MUST answer strictly in this schema:

{
  "recommendations": [
    {
      "name": string,
      "description": string,
      "product_ids": int[]
    }
  ]
}

No extra keys, no comments, no markdown, no natural language outside this JSON.
"""


# --------- 2. Base LLM (Gemini) --------- #

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
    google_api_key=os.environ.get("GOOGLE_API_KEY"),
)


# --------- 3. Agent with structured output --------- #

# Using ToolStrategy explicitly to force structured output:
stylist_agent = create_agent(
    model=llm,
    tools=[],  # no external tools for now; pure reasoning on given JSON
    system_prompt=SYSTEM_PROMPT,
    response_format=ToolStrategy(AIRecommendations),
    # You could also pass response_format=AIRecommendations and let it choose strategy
)


# --------- 4. High-level helper to call the agent --------- #

def get_outfit_recommendations(
    payload: Union[StylistRequestPayload, dict],
    thread_id: str = "style-session-1",
) -> AIRecommendations:
    """
    - Validates input against StylistRequestPayload
    - Sends it to the agent
    - Returns a validated AIRecommendations instance
    """

    # 1) Validate + normalize payload into Pydantic model
    if isinstance(payload, dict):
        payload_obj = StylistRequestPayload.model_validate(payload)
    else:
        payload_obj = payload

    # 2) Serialize to clean JSON for the model
    payload_json = payload_obj.model_dump_json(indent=2)

    user_message = {
        "role": "user",
        "content": (
            "Here is the styling payload. Use it to generate outfit recommendations.\n\n"
            "```json\n"
            f"{payload_json}\n"
            "```"
        ),
    }

    # 3) Optional config (thread_id gives you conversation separation later)
    config = {"configurable": {"thread_id": thread_id}}

    # 4) Call the agent
    result = stylist_agent.invoke(
        {
            "messages": [user_message],
        },
        config=config,
    )

    # `create_agent` with ToolStrategy returns your structured result here:
    structured: AIRecommendations = result["structured_response"]

    return structured
