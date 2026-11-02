// Local sample so the document view can be explored without an API key.
export const SAMPLE_DOCUMENT = `How Vector Databases Work

Vector databases store data as high-dimensional numerical arrays called embeddings. Instead of matching exact keywords, they find items whose meaning is similar, which makes them the backbone of semantic search, recommendation systems, and retrieval-augmented generation.

An embedding model turns a piece of text, an image, or audio into a list of hundreds or thousands of numbers. Items with similar meaning land close together in this space, so "car" and "automobile" end up as neighbors even though they share no letters.

Searching is a matter of geometry. When a query arrives, it is embedded with the same model, and the database looks for the stored vectors nearest to it, usually by cosine similarity or Euclidean distance.

Comparing a query against every stored vector is too slow at scale, so vector databases rely on approximate nearest neighbor indexes. Structures such as HNSW graphs or IVF partitions trade a small amount of accuracy for searches that are orders of magnitude faster.

In practice, most systems pair vector search with metadata filters and traditional keyword ranking. This hybrid approach keeps results relevant while still respecting hard constraints like dates, permissions, or categories.

Choosing a vector database comes down to scale, latency requirements, and operational overhead. A small project can start with an extension to an existing database, while large production systems often justify a dedicated engine.`
