import re
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
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
    conversation_id: Optional[str] = None

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class Conversation(BaseModel):
    messages: list[Message] = []

# Add this global variable after other initializations
conversation_memory = Conversation()

@app.api_route("/", methods=["GET", "POST"])
async def chat_response(data: ChatRequest):
    print("📩 Received email text:", data.message)

    # Add user message to conversation history
    conversation_memory.messages.append(
        Message(role="user", content=data.message)
    )

    # Format conversation history for context
    conversation_context = "\n".join([
        f"{msg.role}: {msg.content}" 
        for msg in conversation_memory.messages[-5:]  # Last 5 messages for context
    ])
    
    # Retrieve relevant knowledge from vector store
    docs = retriever.invoke(data.message)
    knowledge = "\n\n".join(doc.page_content for doc in docs)

    rag_prompt = f"""
    You are a specialized Gmail Assistant. You must only respond to email-related queries and reject any unrelated questions.
    Here are some examples of how you should respond:

    Example 1:
    User: "How do I schedule an email in Gmail?"
    Assistant: "To schedule an email in Gmail, compose your email, click the dropdown arrow next to 'Send,' and select 'Schedule send.'"

    Example 2:
    User: "What's the best way to organize my Gmail inbox?"
    Assistant: "You can use labels, filters, and the priority inbox feature to organize your Gmail inbox efficiently."

    Example 3:
    User: "Tell me a joke."
    Assistant: "I am a Gmail Assistant and can only assist with email-related queries."

    Example 4:
    User: "Why is the sky blue?"
    Assistant: "I am a Gmail Assistant and can only answer email-related queries."

    Now, answer the following email-related question:

    Previous Conversation:
    {conversation_context}

    Current Email Content:
    {data.message}

    Relevant Knowledge:
    {knowledge}
    """

    response = ""
    for chunk in llm.stream(rag_prompt):
        if chunk.content:
            response += chunk.content

    # Add assistant's response to conversation history
    conversation_memory.messages.append(
        Message(role="assistant", content=response)
    )

    print("🤖 AI Response:", response)

    return {"response": response if response else "No AI response generated."}


# Run FastAPI & Gradio together
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


