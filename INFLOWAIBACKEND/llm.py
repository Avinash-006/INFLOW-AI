import os

from langchain_google_genai import ChatGoogleGenerativeAI


def get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        temperature=0,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        streaming=True
    )
