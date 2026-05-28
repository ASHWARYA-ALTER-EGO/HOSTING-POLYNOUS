from app.semantic_search import semantic_search

results = semantic_search.search("artificial intelligence", top_k=5)
print(f"Found {len(results)} results:")
for r in results:
    print(f"  {r['score']}% - {r['query'][:60]}")