import os

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

from ingestion import load_documents
from embeddings import get_embedding_model


def build_vectorstore(data_dir: str, persist_dir: str) -> Chroma:
    embedding_model = get_embedding_model()

    if os.path.exists(persist_dir):
        return Chroma(
            persist_directory=persist_dir,
            embedding_function=embedding_model
        )

    documents = load_documents(data_dir)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )
    chunks = text_splitter.split_documents(documents)

    return Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        persist_directory=persist_dir
    )


def search_with_scores(vectorstore: Chroma, query: str, k: int = 4):
    return vectorstore.similarity_search_with_relevance_scores(query, k=k)

