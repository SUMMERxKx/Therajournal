import MiniSearch from 'minisearch';
import { SearchResult } from '../data/schemas';
import { indexedDBStorage } from '../utils/storage';
import logger from '../utils/logger';

class SearchIndexer {
  private searchIndex: MiniSearch<SearchResult> | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize IndexedDB storage
      await indexedDBStorage.init();

      // Try to load existing index
      const existingIndex = await indexedDBStorage.getItem('searchIndex', 'index');
      
      if (existingIndex) {
        this.searchIndex = MiniSearch.loadJSON(existingIndex, {
          fields: ['title', 'body', 'tags'],
          storeFields: ['id', 'title', 'body', 'tags', 'mood', 'entry_at'],
          searchOptions: {
            boost: { title: 2, tags: 1.5, body: 1 },
            fuzzy: 0.2,
            prefix: true,
          },
        });
        logger.log('Loaded existing search index');
      } else {
        // Create new index
        this.searchIndex = new MiniSearch({
          fields: ['title', 'body', 'tags'],
          storeFields: ['id', 'title', 'body', 'tags', 'mood', 'entry_at'],
          searchOptions: {
            boost: { title: 2, tags: 1.5, body: 1 },
            fuzzy: 0.2,
            prefix: true,
          },
        });
        logger.log('Created new search index');
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize search indexer:', error);
      throw error;
    }
  }

  async addEntry(entry: SearchResult): Promise<void> {
    await this.initialize();

    if (!this.searchIndex) {
      throw new Error('Search index not initialized');
    }

    try {
      // Add entry to index
      this.searchIndex.add(entry);

      // Save index to storage
      const indexData = this.searchIndex.toJSON();
      await indexedDBStorage.setItem('searchIndex', 'index', indexData);

      logger.log('Added entry to search index:', entry.id);
    } catch (error) {
      logger.error('Failed to add entry to search index:', error);
      throw error;
    }
  }

  async updateEntry(entry: SearchResult): Promise<void> {
    await this.initialize();

    if (!this.searchIndex) {
      throw new Error('Search index not initialized');
    }

    try {
      // Update entry in index
      this.searchIndex.replace(entry);

      // Save index to storage
      const indexData = this.searchIndex.toJSON();
      await indexedDBStorage.setItem('searchIndex', 'index', indexData);

      logger.log('Updated entry in search index:', entry.id);
    } catch (error) {
      logger.error('Failed to update entry in search index:', error);
      throw error;
    }
  }

  async removeEntry(entryId: string): Promise<void> {
    await this.initialize();

    if (!this.searchIndex) {
      throw new Error('Search index not initialized');
    }

    try {
      // Remove entry from index
      this.searchIndex.discard(entryId);

      // Save index to storage
      const indexData = this.searchIndex.toJSON();
      await indexedDBStorage.setItem('searchIndex', 'index', indexData);

      logger.log('Removed entry from search index:', entryId);
    } catch (error) {
      logger.error('Failed to remove entry from search index:', error);
      throw error;
    }
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    await this.initialize();

    if (!this.searchIndex) {
      throw new Error('Search index not initialized');
    }

    try {
      const results = this.searchIndex.search(query, {
        limit,
        boost: (result) => {
          // Boost recent entries
          const entryDate = new Date(result.entry_at);
          const daysSinceEntry = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
          const recencyBoost = Math.max(0, 1 - daysSinceEntry / 30); // Boost for last 30 days
          
          return 1 + (recencyBoost * 0.2); // 20% boost for recent entries
        },
      });

      logger.log(`Search for "${query}" returned ${results.length} results`);
      return results as SearchResult[];
    } catch (error) {
      logger.error('Search failed:', error);
      return [];
    }
  }

  async clearIndex(): Promise<void> {
    try {
      await indexedDBStorage.clear('searchIndex');
      this.searchIndex = null;
      this.isInitialized = false;
      logger.log('Cleared search index');
    } catch (error) {
      logger.error('Failed to clear search index:', error);
      throw error;
    }
  }

  async getIndexStats(): Promise<{ entryCount: number; size: number }> {
    await this.initialize();

    if (!this.searchIndex) {
      return { entryCount: 0, size: 0 };
    }

    const entryCount = this.searchIndex.documentCount;
    const indexData = this.searchIndex.toJSON();
    const size = JSON.stringify(indexData).length;

    return { entryCount, size };
  }
}

export const searchIndexer = new SearchIndexer();