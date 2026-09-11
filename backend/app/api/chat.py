from typing import List
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.future import select

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.chatbot import ChatMessage, SenderType
from app.models.user import User
from app.models.ai_tool import AITool
from app.schemas.chat import ChatMessageCreate, ChatMessageOut
from app.core.config import get_settings
from app.services.activity import log_activity

import openai

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

@router.get("/history", response_model=List[ChatMessageOut])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
):
    query = (
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    result = db.execute(query)
    messages = result.scalars().all()
    return messages

@router.post("/send", response_model=List[ChatMessageOut])
async def send_message(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = get_settings()
    
    # Save user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        sender=SenderType.USER,
        content=payload.content
    )
    db.add(user_msg)

    try:
        log_activity(
            db,
            user=current_user,
            action="ai_chat",
            resource_type="ai_tutor",
            resource_id=payload.content[:50],
        )
    except Exception:
        pass
    
    # Fetch AI Tools to provide context
    tools_query = select(AITool).where(AITool.is_active == True).limit(20)
    tools_result = db.execute(tools_query)
    tools = tools_result.scalars().all()
    
    tools_context = "Available tools for developers:\n"
    for tool in tools:
        tools_context += f"- {tool.name} ({tool.category}): {tool.description} [{tool.pricing_type}]\n"

    system_prompt = f"""You are a concise and helpful coding assistant for a Developer Productivity Dashboard.
Your role is to assist the user with coding and recommend AI tools.

CRITICAL INSTRUCTIONS:
1. Keep your answers SHORT, NEAT, and CLEAN.
2. Adapt the length of your response to the user's question. If the user says "Hello" or asks a simple question, reply with a short 1-2 sentence answer.
3. Do NOT give long, overwhelming lists or paragraphs unless specifically asked for a detailed explanation.
4. Provide clear code snippets when necessary, but keep explanations brief.
5. Reference the following tools ONLY if they are directly relevant to the user's query:

{tools_context}
"""

    # Fetch recent chat history to provide conversation context
    history_query = (
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    history_result = db.execute(history_query)
    history_messages = history_result.scalars().all()[::-1]

    messages_payload = [{"role": "system", "content": system_prompt}]
    for msg in history_messages:
        role = "user" if msg.sender == SenderType.USER else "assistant"
        messages_payload.append({"role": role, "content": msg.content})

    # Add the current message
    messages_payload.append({"role": "user", "content": payload.content})

    bot_reply = "I'm sorry, I couldn't process that right now. Please check your API key configuration."

    try:
        api_key = settings.ai_api_key.get_secret_value()
        if not api_key:
            raise ValueError("API Key is missing")
        
        client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url=settings.ai_api_base_url
        )
        
        response = await client.chat.completions.create(
            model=settings.ai_model, # Use model from settings
            messages=messages_payload,
            max_tokens=500,
        )
        if response.choices:
            bot_reply = response.choices[0].message.content
            
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        # We still save the error message so the user knows
        bot_reply = f"Error: Could not get response from AI. Please make sure the API key is valid in the .env file. Details: {str(e)}"
    
    # Save bot message
    bot_msg = ChatMessage(
        user_id=current_user.id,
        sender=SenderType.BOT,
        content=bot_reply
    )
    db.add(bot_msg)
    
    db.commit()
    db.refresh(user_msg)
    db.refresh(bot_msg)
    
    return [user_msg, bot_msg]
