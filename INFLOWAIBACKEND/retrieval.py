from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def extract_sources(docs_with_scores):
    seen = set()
    sources = []
    for doc, score in docs_with_scores:
        source = doc.metadata.get("source", "unknown")
        page = doc.metadata.get("page")
        key = (source, page)
        if key not in seen:
            seen.add(key)
            entry = {"source": source}
            if page is not None:
                entry["page"] = page
            sources.append(entry)
    return sources


def compute_confidence(docs_with_scores):
    if not docs_with_scores:
        return 0.0
    scores = [score for _, score in docs_with_scores]
    return round(sum(scores) / len(scores), 4)


def build_rewrite_chain(llm):
    prompt = ChatPromptTemplate.from_template(
        """Given the following conversation history and a new user question, rewrite the question to be a standalone query that captures all relevant context from the history.
If the new question is already standalone or no history is provided, return the original question.

History:
{history}

New question: {question}
Standalone query:"""
    )
    return prompt | llm | StrOutputParser()


def build_fallback_chain(llm):
    prompt = ChatPromptTemplate.from_template(
        """You are answering based on general knowledge because the internal knowledge base lacked sufficient context. 
Start your response by clearly stating that this is a general knowledge answer and not based on internal data.

Question:
{question}
"""
    )
    return prompt | llm | StrOutputParser()


def build_generation_chain(llm):
    prompt = ChatPromptTemplate.from_template(
        """You are a domain-restricted AI assistant.

Your knowledge domain is strictly limited to: {DOMAIN_NAME}

Rules:
1. If the user's question is related to {DOMAIN_NAME}, try to answer using the Context below. If the context is insufficient, use your internal knowledge about {DOMAIN_NAME} to answer.
2. If the user's question is NOT related to {DOMAIN_NAME}, reply exactly with: "I can only answer questions related to {DOMAIN_NAME}." Do not answer the question.
3. Be concise and helpful. 
4. Do not mention whether the context had the information or not. Just give the answer directly.
5. Do NOT add out-of-domain knowledge.

Context:
{context}

Question:
{question}
"""
    )

    return prompt | llm | StrOutputParser()
