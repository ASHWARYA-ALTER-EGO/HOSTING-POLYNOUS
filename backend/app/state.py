from typing import TypedDict, List, Dict, Optional, Any

class AgentState(TypedDict):
    # User input
    query: str
    session_id: str
    
    # Search results
    retrieved_docs: List[Dict]
    
    # Summaries
    summaries: List[str]
    
    # Critique results
    critique: Dict[str, Any]
    
    # Final output
    final_answer: str
    citations: List[Dict]
    
    # Debate mode
    debate_mode: bool
    debate_history: List[Dict]
    judge_verdict: Optional[Dict]
    
    # Tracking
    errors: List[str]
    warnings: List[str]
    current_agent: str

    # NEW: Knowledge Graph fields
    graph_context: str
    graph_results: List[Dict]