from langgraph.graph import StateGraph, END
from app.state import AgentState
from app.agents.debate_agents import argue_for_position, argue_against_position, judge_debate
from app.search_agent import search_web
from app.knowledge_graph.user_memory import user_memory
from app.semantic_search import semantic_search
from app.chat_history import save_debate

def debate_search_node(state: AgentState) -> AgentState:
    """Search for debate sources"""
    print("\n" + "="*60)
    print("🔍 DEBATE: Searching for sources...")
    print("="*60)
    
    results = search_web(state['query'])
    state['retrieved_docs'] = results
    
    context = [
        f"Source: {doc.get('title', 'Untitled')}\n{doc.get('content', '')[:1000]}"
        for doc in results
    ]
    
    if 'debate_history' not in state:
        state['debate_history'] = []
    
    state['debate_history'].append({"step": "search", "sources_found": len(results)})
    
    print(f"✅ Found {len(results)} sources for debate")
    return state

def for_agent_node(state: AgentState) -> AgentState:
    """Argue FOR"""
    print("\n" + "="*60)
    print("🟢 FOR AGENT")
    print("="*60)
    
    context = [
        f"Source: {doc.get('title', 'Untitled')}\n{doc.get('content', '')[:1000]}"
        for doc in state.get('retrieved_docs', [])
    ]
    
    argument = argue_for_position(state['query'], context)
    
    state['debate_history'].append({
        "side": "FOR",
        "argument": argument
    })
    
    return state

def against_agent_node(state: AgentState) -> AgentState:
    """Argue AGAINST"""
    print("\n" + "="*60)
    print("🔴 AGAINST AGENT")
    print("="*60)
    
    context = [
        f"Source: {doc.get('title', 'Untitled')}\n{doc.get('content', '')[:1000]}"
        for doc in state.get('retrieved_docs', [])
    ]
    
    argument = argue_against_position(state['query'], context)
    
    state['debate_history'].append({
        "side": "AGAINST",
        "argument": argument
    })
    
    return state

def judge_node(state: AgentState) -> AgentState:
    """Judge the debate"""
    print("\n" + "="*60)
    print("⚖️ JUDGE")
    print("="*60)
    
    # Get last FOR and AGAINST arguments
    for_arg = ""
    against_arg = ""
    
    for entry in state.get('debate_history', []):
        if entry.get('side') == 'FOR':
            for_arg = entry.get('argument', '')
        elif entry.get('side') == 'AGAINST':
            against_arg = entry.get('argument', '')
    
    verdict = judge_debate(for_arg, against_arg, state['query'])
    state['judge_verdict'] = verdict
    
    # Build clean debate summary
    winner = verdict.get('winner', 'FOR')
    reasoning = verdict.get('reasoning', '')
    strongest = verdict.get('strongest_point', '')
    for_score = verdict.get('for_score', 5)
    against_score = verdict.get('against_score', 5)
    
    debate_summary = f"""📋 DEBATE RESULT: {state['query']}

🟢 FOR POSITION ({for_score}/10)
{for_arg[:500]}

🔴 AGAINST POSITION ({against_score}/10)
{against_arg[:500]}

⚖️ WINNER: {winner}

💡 STRONGEST POINT
{strongest}

📝 JUDGE'S REASONING
{reasoning}

🎯 SCORES
• FOR: {for_score}/10
• AGAINST: {against_score}/10
"""
    
    state['final_answer'] = debate_summary
    
    # Store citations
    state['citations'] = [
        {'title': doc.get('title', 'Untitled'), 'url': doc.get('url', '')}
        for doc in state.get('retrieved_docs', [])
    ]
    
    # ========== Store debate in user memory ==========
    print(f"📌 Storing debate for user_id: guest_user")
    try:
        user_memory.record_debate(
            user_id="guest_user",
            topic=state['query'],
            for_score=for_score,
            against_score=against_score,
            winner=winner
        )
        print("  ✅ Stored in User Memory")
    except Exception as e:
        print(f"  ⚠️ Memory storage error: {e}")
    
    # ========== Index debate in semantic search ==========
    try:
        semantic_search.add_to_index(
            query=state['query'],
            answer=state.get('final_answer', ''),
            mode="debate",
            confidence=for_score * 10,
            sources=state.get('citations', [])
        )
        print("  🔍 Indexed debate for Semantic Search")
    except Exception as e:
        print(f"  ⚠️ Search indexing error: {e}")
    
    # ========== Save debate to chat history - Using "guest_user" explicitly ==========
    try:
        save_debate(
            session_id="guest_user",  # ← EXPLICITLY "guest_user", NOT state.get()
            topic=state['query'],
            for_score=for_score,
            against_score=against_score,
            winner=winner,
            reasoning=reasoning,
            sources=state.get('citations', [])
        )
        print("  💾 Saved debate to Chat History")
    except Exception as e:
        print(f"  ⚠️ Chat history save error: {e}")
    
    print(f"✅ Debate complete! Winner: {winner}")
    print("="*60 + "\n")
    return state

def create_debate_graph():
    """Create debate mode workflow"""
    
    workflow = StateGraph(AgentState)
    
    workflow.add_node("debate_search", debate_search_node)
    workflow.add_node("for_agent", for_agent_node)
    workflow.add_node("against_agent", against_agent_node)
    workflow.add_node("judge", judge_node)
    
    workflow.set_entry_point("debate_search")
    workflow.add_edge("debate_search", "for_agent")
    workflow.add_edge("for_agent", "against_agent")
    workflow.add_edge("against_agent", "judge")
    workflow.add_edge("judge", END)
    
    return workflow.compile()

debate_graph = create_debate_graph()
print("✅ Debate Orchestrator Ready!")