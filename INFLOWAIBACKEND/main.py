from dotenv import load_dotenv

from vectorstore import build_vectorstore
from llm import get_llm
from retrieval import build_generation_chain, build_rewrite_chain, build_fallback_chain
from api import create_app



load_dotenv(override=True)

vs = build_vectorstore(data_dir="synthetic_company_dataset", persist_dir="../rag_db")
model = get_llm()
gen_chain = build_generation_chain(model)
rewrite_chain = build_rewrite_chain(model)
fallback_chain = build_fallback_chain(model)

app = create_app(vs, gen_chain, rewrite_chain, fallback_chain)
