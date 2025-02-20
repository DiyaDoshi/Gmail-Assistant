from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import gradio as gr
import logging
from typing import Optional

load_dotenv()

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS configuration
origins = ["http://127.0.0.1:8000", "chrome-extension://kaamofllcbjfinmfcdolbidpohkmeddh"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific domains if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CHROMA_PATH = r"chroma_db"

# Initialize models
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=1.0)

# Connect to ChromaDB
vector_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings_model,
    persist_directory=CHROMA_PATH, 
)

retriever = vector_store.as_retriever(search_kwargs={'k': 5})

class ChatRequest(BaseModel):
    message: str

@app.api_route("/", methods=["GET", "POST"])
async def chat_response(data: ChatRequest):
    print("📩 Received email text:", data.message)

    # Retrieve relevant knowledge from vector store
    docs = retriever.invoke(data.message)
    knowledge = "\n\n".join(doc.page_content for doc in docs)

    
    rag_prompt = f"""
    You are an AI assistant responding to emails. Use the context below to generate a helpful reply.
    
    Email Content: {data.message}
    
    Relevant Knowledge:
    {knowledge}
    """

    response = ""
    for chunk in llm.stream(rag_prompt):
        if chunk.content:
            response += chunk.content


    print("🤖 AI Response:", response)

    return {"response": response if response else "No AI response generated."}


# Run FastAPI & Gradio together
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


