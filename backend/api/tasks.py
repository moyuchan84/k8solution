import asyncio
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services.redis_client import get_redis

router = APIRouter()


@router.get("/{tracking_id}")
async def get_task(tracking_id: str):
    redis = await get_redis()
    raw = await redis.get(f"task:{tracking_id}")
    if not raw:
        raise HTTPException(status_code=404, detail="Task not found")
    return json.loads(raw)


@router.get("/{tracking_id}/stream")
async def stream_task(tracking_id: str):
    """SSE 스트림으로 작업 진행 상태를 실시간 전달."""
    async def event_generator():
        redis = await get_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"task:{tracking_id}:events")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
        finally:
            await pubsub.unsubscribe()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
