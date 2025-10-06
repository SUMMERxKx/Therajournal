import MiniSearch from 'minisearch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EntryPlain, SearchResult, SearchQuery } from '../data/schemas';
import { MAX_SEARCH_RESULTS, SEARCH_CACHE_DURATION, STORAGE_KEYS } from '../utils/constants';

// Add AsyncStorage to package.json dependencies
// npm install @react-native-async-storage/async-storage

interface SearchIndex {
  entries: EntryPlain[];
  lastUpdated: string;
}

interface CachedSearch {
  query: string;
  results: SearchResult[];
  timestamp: number;
}

export class SearchIndexer {
  private miniSearch: MiniSearch<EntryPlain>;
  private entries: Map<string, EntryPlain> = new Map();
  private searchCache: Map<string, CachedSearch> = new Map();
  private isInitialized = false;
  private readonly MAX_INDEXED_LENGTH = 3000; // Cap indexed text length

  constructor() {
    this.miniSearch = new MiniSearch({
      fields: ['title', 'body', 'tags'],
      storeFields: ['id', 'user_id', 'created_at', 'entry_at', 'mood'],
      searchOptions: {
        boost: { title: 2, tags: 1.5, body: 1 },
        fuzzy: 0.2,
        prefix: true,
        combineWith: 'AND',
        weights: { fuzzy: 0.2, prefix: 0.8, exact: 1.0 }
      }
    });
  }

  /**
   * Initialize the search index from stored data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      let indexData: SearchIndex | null = null;
      
      // Try to load chunked data first
      const metaData = await AsyncStorage.getItem(`${STORAGE_KEYS.SEARCH_INDEX}_meta`);
      if (metaData) {
        const meta = JSON.parse(metaData);
        const chunks: string[] = [];
        
        for (let i = 0; i < meta.chunks; i++) {
          const chunk = await AsyncStorage.getItem(`${STORAGE_KEYS.SEARCH_INDEX}_chunk_${i}`);
          if (chunk) chunks.push(chunk);
        }
        
        if (chunks.length === meta.chunks) {
          const jsonString = chunks.join('');
          indexData = JSON.parse(jsonString);
        }
      }
      
      // Fallback to single storage
      if (!indexData) {
        const cachedIndex = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_INDEX);
        if (cachedIndex) {
          indexData = JSON.parse(cachedIndex);
        }
      }
      
      if (indexData) {
        // Restore entries map
        indexData.entries.forEach(entry => {
          this.entries.set(entry.id, entry);
        });

        // Rebuild MiniSearch index with prepared entries
        const preparedEntries = indexData.entries.map(entry => this.prepareEntryForIndexing(entry));
        this.miniSearch.addAll(preparedEntries);
        
        console.log(`Loaded ${indexData.entries.length} entries into search index`);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize search index:', error);
      this.isInitialized = true; // Continue with empty index
    }
  }

  /**
   * Prepare entry for indexing (cap text length)
   */
  private prepareEntryForIndexing(entry: EntryPlain): EntryPlain {
    return {
      ...entry,
      body: entry.body.length > this.MAX_INDEXED_LENGTH 
        ? entry.body.substring(0, this.MAX_INDEXED_LENGTH) + '...'
        : entry.body
    };
  }

  /**
   * Add or update an entry in the search index
   */
  async addEntry(entry: EntryPlain): Promise<void> {
    try {
      // Prepare entry for indexing
      const indexedEntry = this.prepareEntryForIndexing(entry);
      
      // Update entries map
      this.entries.set(entry.id, entry);

      // Update MiniSearch index
      if (this.miniSearch.has(entry.id)) {
        this.miniSearch.replace(indexedEntry);
      } else {
        this.miniSearch.add(indexedEntry);
      }

      // Clear search cache since index changed
      this.clearSearchCache();

      // Persist to storage
      await this.persistIndex();

      console.log(`Added entry ${entry.id} to search index`);
    } catch (error) {
      console.error('Failed to add entry to search index:', error);
    }
  }

  /**
   * Remove an entry from the search index
   */
  async removeEntry(entryId: string): Promise<void> {
    try {
      // Remove from entries map
      this.entries.delete(entryId);

      // Remove from MiniSearch index
      if (this.miniSearch.has(entryId)) {
        this.miniSearch.discard(entryId);
      }

      // Clear search cache since index changed
      this.clearSearchCache();

      // Persist to storage
      await this.persistIndex();

      console.log(`Removed entry ${entryId} from search index`);
    } catch (error) {
      console.error('Failed to remove entry from search index:', error);
    }
  }

  /**
   * Update multiple entries (for bulk operations)
   */
  async updateEntries(entries: EntryPlain[]): Promise<void> {
    try {
      // Clear existing index
      this.miniSearch.removeAll();
      this.entries.clear();

      // Add all entries
      entries.forEach(entry => {
        this.entries.set(entry.id, entry);
      });

      this.miniSearch.addAll(entries);

      // Clear search cache since index changed
      this.clearSearchCache();

      // Persist to storage
      await this.persistIndex();

      console.log(`Updated search index with ${entries.length} entries`);
    } catch (error) {
      console.error('Failed to update entries in search index:', error);
    }
  }

  /**
   * Search for entries
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check cache first
    const cacheKey = this.getCacheKey(query);
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_DURATION) {
      return cached.results;
    }

    try {
      let results = this.miniSearch.search(query.query, {
        filter: (result) => this.applyFilters(result, query.filters),
        fuzzy: 0.2,
        prefix: true,
        boost: { title: 2, tags: 1.5, body: 1 }
      });

      // Apply recency boost
      results = this.applyRecencyBoost(results);

      // Limit results
      results = results.slice(0, query.limit || MAX_SEARCH_RESULTS);

      // Convert to SearchResult format
      const searchResults: SearchResult[] = results.map(result => ({
        id: result.id,
        title: result.title,
        body: this.truncateBody(result.body, 200),
        tags: result.tags || [],
        mood: result.mood,
        entry_at: result.entry_at,
        score: result.score
      }));

      // Cache results
      this.searchCache.set(cacheKey, {
        query: query.query,
        results: searchResults,
        timestamp: Date.now()
      });

      return searchResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get entry by ID
   */
  getEntry(entryId: string): EntryPlain | undefined {
    return this.entries.get(entryId);
  }

  /**
   * Get all entries
   */
  getAllEntries(): EntryPlain[] {
    return Array.from(this.entries.values());
  }

  /**
   * Clear the entire search index
   */
  async clear(): Promise<void> {
    try {
      this.miniSearch.removeAll();
      this.entries.clear();
      this.clearSearchCache();
      await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_INDEX);
      console.log('Cleared search index');
    } catch (error) {
      console.error('Failed to clear search index:', error);
    }
  }

  /**
   * Get index statistics
   */
  getStats(): { entryCount: number; cacheSize: number } {
    return {
      entryCount: this.entries.size,
      cacheSize: this.searchCache.size
    };
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(result: any, filters?: SearchQuery['filters']): boolean {
    if (!filters) return true;

    // Mood filter
    if (filters.moodRange && result.mood !== null) {
      const [min, max] = filters.moodRange;
      if (result.mood < min || result.mood > max) return false;
    }

    // Date filter
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      if (result.entry_at < start || result.entry_at > end) return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const entryTags = result.tags || [];
      const hasMatchingTag = filters.tags.some(tag => 
        entryTags.some((entryTag: string) => 
          entryTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  }

  /**
   * Apply recency boost to search results
   */
  private applyRecencyBoost(results: any[]): any[] {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return results.map(result => {
      const entryDate = new Date(result.entry_at);
      let recencyBoost = 1.0;

      if (entryDate > oneWeekAgo) {
        recencyBoost = 1.2; // 20% boost for recent entries
      } else if (entryDate > oneMonthAgo) {
        recencyBoost = 1.1; // 10% boost for somewhat recent entries
      }

      return {
        ...result,
        score: result.score * recencyBoost
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Apply mood bias to search results
   */
  applyMoodBias(results: SearchResult[], targetMood?: number): SearchResult[] {
    if (targetMood === undefined) return results;

    return results.map(result => {
      if (result.mood === undefined) return result;

      const moodDiff = Math.abs(result.mood - targetMood);
      const moodBoost = Math.max(0, 1 - (moodDiff / 10)); // Max 10% boost for exact mood match

      return {
        ...result,
        score: result.score * (1 + moodBoost * 0.1)
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Truncate body text for search results
   */
  private truncateBody(body: string, maxLength: number): string {
    if (body.length <= maxLength) return body;
    
    const truncated = body.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Generate cache key for search query
   */
  private getCacheKey(query: SearchQuery): string {
    return `${query.query}-${JSON.stringify(query.filters || {})}-${query.limit}`;
  }

  /**
   * Clear search cache
   */
  private clearSearchCache(): void {
    this.searchCache.clear();
  }

  /**
   * Persist search index to storage (chunked for large datasets)
   */
  private async persistIndex(): Promise<void> {
    try {
      const entries = Array.from(this.entries.values());
      const indexData: SearchIndex = {
        entries,
        lastUpdated: new Date().toISOString()
      };

      const jsonString = JSON.stringify(indexData);
      
      // Check if we need to chunk the data (5MB limit)
      if (jsonString.length > 5 * 1024 * 1024) {
        // Split into chunks
        const chunkSize = 4 * 1024 * 1024; // 4MB chunks
        const chunks: string[] = [];
        
        for (let i = 0; i < jsonString.length; i += chunkSize) {
          chunks.push(jsonString.substring(i, i + chunkSize));
        }
        
        // Store chunks
        for (let i = 0; i < chunks.length; i++) {
          await AsyncStorage.setItem(
            `${STORAGE_KEYS.SEARCH_INDEX}_chunk_${i}`,
            chunks[i]
          );
        }
        
        // Store metadata
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.SEARCH_INDEX}_meta`,
          JSON.stringify({ chunks: chunks.length })
        );
      } else {
        // Store normally
        await AsyncStorage.setItem(
          STORAGE_KEYS.SEARCH_INDEX, 
          jsonString
        );
      }
    } catch (error) {
      console.error('Failed to persist search index:', error);
    }
  }
}

// Singleton instance
export const searchIndexer = new SearchIndexer();
