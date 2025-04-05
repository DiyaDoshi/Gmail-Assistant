import re
from fastapi import FastAPI
from pydantic import BaseModel
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
origins = ["https://gmail-assistant.onrender.com", "chrome-extension://kaamofllcbjfinmfcdolbidpohkmeddh"]

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

# Add this class after other BaseModel definitions
class EmailContext(BaseModel):
    content: str
    processed: bool = False

# Add these global variables after other initializations
conversation_memory = Conversation()
current_email = None  # Will store the EmailContext

@app.api_route("/", methods=["GET", "POST"])
async def chat_response(data: ChatRequest):
    global current_email
    print("📩 Received email text:", data.message)

    # If this looks like an email (contains common email markers), store it as current email
    if any(marker in data.message.lower() for marker in ["subject:", "from:", "to:", "@"]):
        current_email = EmailContext(content=data.message)
    
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

    # Modified prompt to include email context
    rag_prompt = f"""
    You are a specialized Gmail Assistant. When a user first shares an email with you, you must:
    1. First ask them what they would like to do with the email (summarize, draft a reply, suggest actions, or analyze)
    2. Wait for their choice before providing the specific assistance they requested

    Current Email Being Discussed:
    {current_email.content if current_email else "No email currently in context"}

    When asked to draft a reply:
    - Generate ONE concise and appropriate reply
    - Keep it professional but friendly
    - Don't provide multiple options
    
    When asked to summarize:
    - Provide a brief, clear summary of the email content
    - Include key points and any action items

    Previous Conversation:
    {conversation_context}

    Current User Message:
    {data.message}

    Relevant Knowledge:
    {knowledge}

    If this is the first message about this email, ask the user what they would like you to do with it.
    If there's no email in context and the user asks for email-related tasks, ask them to share the email first.
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





