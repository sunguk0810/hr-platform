/**
 * Utility functions for file downloads
 */

/**
 * Download a Blob as a file
 * @param blob - The blob data to download
 * @param filename - The filename with extension
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download data as a CSV file
 * @param data - Array of objects to convert to CSV
 * @param filename - The filename without extension
 * @param headers - Optional custom headers mapping (key: display name)
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = Object.keys(data[0]);
  const headerRow = keys.map((key) => headers?.[key] || key);

  const csvRows = [
    headerRow.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined) {
            return '""';
          }
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return `"${stringValue}"`;
        })
        .join(',')
    ),
  ];

  // Add BOM for Korean characters
  const BOM = '\uFEFF';
  const csvContent = BOM + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Download data as a JSON file
 * @param data - The data to convert to JSON
 * @param filename - The filename without extension
 */
export function downloadJSON(data: unknown, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Generate a timestamped filename
 * @param prefix - Filename prefix
 * @param extension - File extension (without dot)
 */
export function generateTimestampedFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Format file size to human-readable string
 * @param bytes - Size in bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
