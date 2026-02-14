/**
 * Calculate days until a date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Days remaining (negative if expired)
 */
export const daysUntilDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Calculate days until expiry (alias for daysUntilDate)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Days remaining (negative if expired)
 */
export const getDaysUntilExpiry = (dateString) => {
  return daysUntilDate(dateString);
};

/**
 * Get badge color class based on days remaining
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Tailwind CSS classes for badge
 */
export const getDateBadgeClass = (dateString) => {
  if (!dateString || dateString === 'N/A') {
    return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
  
  const daysLeft = daysUntilDate(dateString);
  
  if (daysLeft < 0) {
    // Expired - Red
    return 'bg-red-500/20 text-red-400 border border-red-500/50';
  } else if (daysLeft <= 20) {
    // Expiring soon - Orange
    return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
  } else {
    // Valid - Green
    return 'bg-green-500/20 text-green-400 border border-green-500/50';
  }
};

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
export const formatDisplayDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format date for display (alias for formatDisplayDate)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
export const formatDateForDisplay = (dateString) => {
  return formatDisplayDate(dateString);
};
