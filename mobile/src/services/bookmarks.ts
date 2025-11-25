import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@mysellguid_bookmarks';

export const bookmarkService = {
  /**
   * Get all bookmarked sale IDs
   */
  async getBookmarks(): Promise<string[]> {
    try {
      const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  },

  /**
   * Add a sale to bookmarks
   */
  async addBookmark(saleId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      if (!bookmarks.includes(saleId)) {
        bookmarks.push(saleId);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return false;
    }
  },

  /**
   * Remove a sale from bookmarks
   */
  async removeBookmark(saleId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const filtered = bookmarks.filter((id) => id !== saleId);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  },

  /**
   * Check if a sale is bookmarked
   */
  async isBookmarked(saleId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.includes(saleId);
    } catch (error) {
      console.error('Error checking bookmark:', error);
      return false;
    }
  },

  /**
   * Toggle bookmark status
   */
  async toggleBookmark(saleId: string): Promise<boolean> {
    const isCurrentlyBookmarked = await this.isBookmarked(saleId);
    if (isCurrentlyBookmarked) {
      await this.removeBookmark(saleId);
      return false;
    } else {
      await this.addBookmark(saleId);
      return true;
    }
  },

  /**
   * Clear all bookmarks
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BOOKMARKS_KEY);
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
    }
  },
};
