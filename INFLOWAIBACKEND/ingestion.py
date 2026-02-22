from pathlib import Path

from langchain_core.documents import Document
from langchain_community.document_loaders import DirectoryLoader, TextLoader, PyPDFLoader

import pytesseract
from PIL import Image


def load_documents(data_dir: str) -> list[Document]:
    txt_loader = DirectoryLoader(
        data_dir,
        glob="**/*.txt",
        loader_cls=TextLoader,
        show_progress=True,
        use_multithreading=True
    )
    txt_documents = txt_loader.load()

    pdf_documents = []
    pdf_dir = Path(data_dir)
    for pdf_file in pdf_dir.rglob("*.pdf"):
        loader = PyPDFLoader(str(pdf_file))
        pdf_documents.extend(loader.load())

    image_documents = []
    for image_file in pdf_dir.rglob("*.png"):
        text = pytesseract.image_to_string(
            Image.open(image_file),
            config='--oem 3 --psm 6'
        )
        image_documents.append(
            Document(page_content=text, metadata={"source": str(image_file)})
        )

    for image_file in pdf_dir.rglob("*.jpg"):
        text = pytesseract.image_to_string(
            Image.open(image_file),
            config='--oem 3 --psm 6'
        )
        image_documents.append(
            Document(page_content=text, metadata={"source": str(image_file)})
        )

    return txt_documents + pdf_documents + image_documents
