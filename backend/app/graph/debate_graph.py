from langgraph.graph import StateGraph, END
from app.state import AgentState
from app.agents.debate_agents import argue_for_position, argue_against_position, judge_debate
from app.search_agent import search_web

MAX_DEBATE_ROUNDS = 1  # Can increase for multi-round debates

def debate_search_node(state: AgentState) -> AgentState:
    """Search for debate sources"""
    print("\n" + "="*60)
    print("🔍 DEBATE: Searching for sources...")
    print("="*60)
    
    results = search_web(state['query'])
    state['retrieved_docs'] = results
    
    # Create context strings
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
    
    # Create final debate summary
    winner = verdict.get('winner', 'TIE')
    reasoning = verdict.get('reasoning', '')
    strongest = verdict.get('strongest_point', '')
    for_score = verdict.get('for_score', 5)
    against_score = verdict.get('against_score', 5)
    
    debate_summary = f"""
╔══════════════════════════════════════╗
║        🏛️ DEBATE RESULTS           ║
╠══════════════════════════════════════╣
║                                      ║
║  🟢 FOR ({for_score}/10)              ║
║  {for_arg[:200]}...                 ║
║                                      ║
║  🔴 AGAINST ({against_score}/10)      ║
║  {against_arg[:200]}...             ║
║                                      ║
║  ⚖️ WINNER: {winner}                ║
║  💡 {strongest[:100]}              ║
║  📝 {reasoning[:150]}              ║
║                                      ║
╚══════════════════════════════════════╝
"""
    
    state['final_answer'] = debate_summary
    
    # Also store formatted citations
    state['citations'] = [
        {'title': doc.get('title', 'Untitled'), 'url': doc.get('url', '')}
        for doc in state.get('retrieved_docs', [])
    ]
    
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