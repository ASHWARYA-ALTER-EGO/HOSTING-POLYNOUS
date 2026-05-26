# app/graph/orchestrator.py
from app.semantic_search import semantic_search
from app.knowledge_graph.hybrid_search import hybrid
from app.knowledge_graph.graph_manager import kg
from app.knowledge_graph.user_memory import user_memory
from langgraph.graph import StateGraph, END
from app.state import AgentState
from app.agents.summariser_agent import summariser_agent
from app.agents.critic_agent import critic_agent
from app.agents.writer_agent import writer_agent
from app.search_agent import search_web
from app.chat_history import save_chat

def search_node(state: AgentState) -> AgentState:
    """Search Agent - Find relevant documents + graph context"""
    print("\n" + "="*60)
    print("🔍 STEP 1: SEARCH AGENT (Hybrid)")
    print("="*60)
    
    state['current_agent'] = 'search'
    
    # Web search
    results = search_web(state['query'])
    state['retrieved_docs'] = results
    
    # Hybrid search for enhanced context
    print("🧠 Running hybrid search...")
    try:
        hybrid_results = hybrid.hybrid_search(state['query'])
        entities = hybrid._extract_entities(state['query'])
        if entities:
            print(f"📌 Detected entities: {entities}")
            kg.extract_and_link_entities(state['query'])
        state['graph_context'] = hybrid_results.get('enhanced_context', '')
        state['graph_results'] = hybrid_results.get('graph_results', [])
        graph_count = len(hybrid_results.get('graph_results', []))
    except Exception as e:
        print(f"⚠️ Hybrid search unavailable: {e}")
        state['graph_context'] = ''
        state['graph_results'] = []
        graph_count = 0
    
    # Extract citations
    state['citations'] = [
        {
            'title': doc.get('title', 'Untitled'),
            'url': doc.get('url', ''),
            'source': doc.get('source', 'web')
        }
        for doc in results
    ]
    
    print(f"✅ Found {len(results)} web sources + {graph_count} graph connections")
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
    """Writer Agent - Create final answer with graph insights"""
    print("\n" + "="*60)
    print("✍️ STEP 4: WRITER AGENT (with Knowledge Graph)")
    print("="*60)
    
    state['current_agent'] = 'writer'
    
    # Get graph context if available
    graph_context = state.get('graph_context', '')
    
    # Add graph context to summaries for enhanced answer
    enhanced_summaries = state['summaries'].copy()
    if graph_context:
        enhanced_summaries.append(f"KNOWLEDGE GRAPH INSIGHTS:\n{graph_context}")
    
    answer = writer_agent(
        state['query'],
        enhanced_summaries,
        state['critique'],
        state['citations']
    )
    state['final_answer'] = answer
    
    # Extract entities for storage
    try:
        entities = hybrid._extract_entities(state['query'])
    except:
        entities = []
    
    # Get confidence
    conf = state.get('critique', {}).get('overall_confidence', 0)
    
    # ========== Store in Knowledge Graph ==========
    try:
        kg.add_research_entry(
            query=state['query'],
            answer=answer,
            sources=state['citations'],
            confidence=conf,
            topics=entities,
            session_id="guest_user"
        )
        print("🧠 Stored in Knowledge Graph")
    except Exception as e:
        print(f"⚠️ Knowledge Graph storage: {e}")
    
    # ========== Record in User Memory ==========
    try:
        user_memory.record_research(
            user_id="guest_user",
            query=state['query'],
            answer=answer,
            topics=entities,
            confidence=conf,
            mode="research",
            sources=state['citations']
        )
        print("🧠 Recorded in User Memory")
    except Exception as e:
        print(f"⚠️ User memory recording: {e}")
    
    # ========== Index in Semantic Search ==========
    try:
        semantic_search.add_to_index(
            query=state['query'],
            answer=answer,
            mode="research",
            confidence=conf,
            sources=state.get('citations', [])
        )
        print("🔍 Indexed for Semantic Search")
    except Exception as e:
        print(f"⚠️ Search indexing: {e}")
    
    # ========== Save to Chat History - CORRECTED: No topics parameter ==========
    try:
        save_chat(
            session_id="guest_user",  # ← EXPLICITLY "guest_user"
            query=state['query'],
            answer=answer,
            confidence=conf,
            sources=state.get('citations', [])
        )
        print("💾 Saved to Chat History")
    except Exception as e:
        print(f"⚠️ Chat history save error: {e}")
    
    print("✅ Final answer ready with graph insights!")
    print("="*60 + "\n")
    return state

def create_orchestrator():
    """Create the multi-agent workflow graph"""
    
    workflow = StateGraph(AgentState)
    
    workflow.add_node("search", search_node)
    workflow.add_node("summarise", summarise_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("write", writer_node)
    
    workflow.set_entry_point("search")
    workflow.add_edge("search", "summarise")
    workflow.add_edge("summarise", "critic")
    workflow.add_edge("critic", "write")
    workflow.add_edge("write", END)
    
    return workflow.compile()

orchestrator = create_orchestrator()
print("✅ Multi-Agent Orchestrator Ready!")