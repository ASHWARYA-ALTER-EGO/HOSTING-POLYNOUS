from langgraph.graph import StateGraph, END
from app.state import AgentState
from app.agents.summariser_agent import summariser_agent
from app.agents.critic_agent import critic_agent
from app.agents.writer_agent import writer_agent
from app.search_agent import search_web
import uuid

def search_node(state: AgentState) -> AgentState:
    """Search Agent - Find relevant documents"""
    print("\n" + "="*60)
    print("🔍 STEP 1: SEARCH AGENT")
    print("="*60)
    
    state['current_agent'] = 'search'
    
    # Search web
    results = search_web(state['query'])
    state['retrieved_docs'] = results
    
    # Extract citations
    state['citations'] = [
        {
            'title': doc.get('title', 'Untitled'),
            'url': doc.get('url', ''),
            'source': doc.get('source', 'web')
        }
        for doc in results
    ]
    
    print(f"✅ Found {len(results)} sources")
    return state

def summarise_node(state: AgentState) -> AgentState:
    """Summariser Agent - Condense each document"""
    print("\n" + "="*60)
    print("📝 STEP 2: SUMMARISER AGENT")
    print("="*60)
    
    state['current_agent'] = 'summariser'
    
    summaries = summariser_agent(
        state['retrieved_docs'],
        state['query']
    )
    state['summaries'] = summaries
    
    print(f"✅ Summarized {len(summaries)} documents")
    return state

def critic_node(state: AgentState) -> AgentState:
    """Critic Agent - Check facts and confidence"""
    print("\n" + "="*60)
    print("🔎 STEP 3: CRITIC AGENT")
    print("="*60)
    
    state['current_agent'] = 'critic'
    
    critique = critic_agent(
        state['summaries'],
        state['query']
    )
    state['critique'] = critique
    
    print(f"✅ Analysis complete. Confidence: {critique.get('overall_confidence', 'N/A')}%")
    return state

def writer_node(state: AgentState) -> AgentState:
    """Writer Agent - Create final answer"""
    print("\n" + "="*60)
    print("✍️ STEP 4: WRITER AGENT")
    print("="*60)
    
    state['current_agent'] = 'writer'
    
    answer = writer_agent(
        state['query'],
        state['summaries'],
        state['critique'],
        state['citations']
    )
    state['final_answer'] = answer
    
    print("✅ Final answer ready!")
    print("="*60 + "\n")
    return state

def create_orchestrator():
    """Create the multi-agent workflow graph"""
    
    workflow = StateGraph(AgentState)
    
    # Add all agent nodes
    workflow.add_node("search", search_node)
    workflow.add_node("summarise", summarise_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("write", writer_node)
    
    # Define the flow: search → summarise → critic → write → END
    workflow.set_entry_point("search")
    workflow.add_edge("search", "summarise")
    workflow.add_edge("summarise", "critic")
    workflow.add_edge("critic", "write")
    workflow.add_edge("write", END)
    
    return workflow.compile()

# Create the global orchestrator
orchestrator = create_orchestrator()
print("✅ Multi-Agent Orchestrator Ready!")