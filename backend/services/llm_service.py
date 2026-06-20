import logging
from config import settings

logger = logging.getLogger(__name__)

_llm = None


def _get_llm():
    global _llm
    if _llm is None:
        from langchain_openai import ChatOpenAI
        _llm = ChatOpenAI(
            base_url=settings.llm_base_url,
            model=settings.llm_model,
            api_key=settings.llm_api_key,
        )
    return _llm


async def suggest_resource_size(service_description: str) -> str:
    """서비스 설명을 바탕으로 S/M/L 리소스 크기를 추천."""
    if not settings.llm_enabled:
        return "S"
    llm = _get_llm()
    prompt = (
        f"다음 서비스 설명을 읽고 적절한 K8s 리소스 크기를 S, M, L 중 하나만 답하세요.\n"
        f"S: 가벼운 서비스, M: 일반적인 웹 서비스, L: 고부하 서비스\n\n"
        f"서비스 설명: {service_description}\n\n"
        f"답변 (S, M, 또는 L만):"
    )
    response = await llm.ainvoke(prompt)
    result = response.content.strip().upper()
    return result if result in ("S", "M", "L") else "S"


async def diagnose_error(error_message: str) -> str:
    """K8s 에러 메시지를 한국어로 진단."""
    if not settings.llm_enabled:
        return error_message
    llm = _get_llm()
    prompt = (
        f"다음 Kubernetes 에러 메시지를 한국어로 쉽게 설명하고, 해결 방법을 제안하세요.\n\n"
        f"에러: {error_message}"
    )
    response = await llm.ainvoke(prompt)
    return response.content


async def summarize_provisioning(resources: dict) -> str:
    """프로비저닝 완료 후 생성된 리소스를 자연어로 요약."""
    if not settings.llm_enabled:
        return str(resources)
    llm = _get_llm()
    prompt = (
        f"다음 Kubernetes 리소스 생성 결과를 개발자가 이해하기 쉬운 한국어 요약으로 작성하세요.\n\n"
        f"생성된 리소스: {resources}"
    )
    response = await llm.ainvoke(prompt)
    return response.content
